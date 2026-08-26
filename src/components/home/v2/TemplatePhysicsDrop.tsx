'use client';

import { resumeTemplates } from '@/json/resumeTemplates';
import { buildSpawnPositions } from '@/lib/homeV2/buildSpawnPositions';
import {
  captureExpandFromLayout,
  captureExpandFromPhysics,
} from '@/lib/homeV2/expandedResumeLayout';
import { clampResumeTilt, MAX_RESUME_TILT } from '@/lib/homeV2/resumeTiltLimits';
import Matter from 'matter-js';
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type MouseEvent } from 'react';
import PhysicsTemplateCard, { getPhysicsCardMetrics } from './PhysicsTemplateCard';
import ResumeExpandOverlay, { type ExpandAnchor } from './ResumeExpandOverlay';

const { Engine, Bodies, Body, Composite, World } = Matter;

const WALL = 80;
const GROUND_INSET = 12;
const OVERLAY_DISMISS_MS = 100;
const FIXED_DT = 1000 / 60;
const DEFAULT_OPACITY = 1;
const DIMMED_OPACITY = 0.32;

function subscribeReduceMotion(onStoreChange: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', onStoreChange);
  return () => mq.removeEventListener('change', onStoreChange);
}

function getReduceMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getServerReduceMotion() {
  return false;
}

type BodyPair = {
  body: Matter.Body | null;
  w: number;
  h: number;
};

function uprightClamp(body: Matter.Body) {
  const clamped = clampResumeTilt(body.angle);
  Body.setAngle(body, clamped);
  const av = body.angularVelocity * 0.8;
  if (clamped >= MAX_RESUME_TILT - 0.02 && av > 0) {
    Body.setAngularVelocity(body, 0);
    return;
  }
  if (clamped <= -MAX_RESUME_TILT + 0.02 && av < 0) {
    Body.setAngularVelocity(body, 0);
    return;
  }
  Body.setAngularVelocity(body, Math.max(-1.15, Math.min(1.15, av)));
}

function syncDom(pairs: BodyPair[], itemRefs: { current: (HTMLDivElement | null)[] }) {
  for (let i = 0; i < pairs.length; i++) {
    const el = itemRefs.current[i];
    const pair = pairs[i];
    if (!el || !pair?.body) continue;
    const { x, y } = pair.body.position;
    const angle = pair.body.angle;
    el.style.visibility = 'visible';
    el.style.transform = `translate3d(${x - pair.w / 2}px, ${y - pair.h / 2}px, 0) rotate(${angle}rad)`;
  }
}

function clearHoverUnlessSibling(
  e: MouseEvent<HTMLDivElement>,
  onClear: () => void,
) {
  const next = e.relatedTarget;
  if (next instanceof Node && e.currentTarget.parentElement?.contains(next)) {
    const shell = (next as Element).closest('[data-physics-item]');
    if (shell) return;
  }
  onClear();
}

function freezePhysicsBodies(pairs: BodyPair[]) {
  for (const pair of pairs) {
    if (!pair?.body) continue;
    Body.setVelocity(pair.body, { x: 0, y: 0 });
    Body.setAngularVelocity(pair.body, 0);
  }
}

function buildBounds(viewW: number, viewH: number) {
  const groundY = viewH - GROUND_INSET;
  return {
    groundY,
    bounds: [
      Bodies.rectangle(viewW / 2, groundY + WALL / 2, viewW + WALL * 2, WALL, {
        isStatic: true,
        friction: 0.88,
        label: 'ground',
      }),
      Bodies.rectangle(-WALL / 2, viewH / 2, WALL, viewH * 2, { isStatic: true, label: 'wall-left' }),
      Bodies.rectangle(viewW + WALL / 2, viewH / 2, WALL, viewH * 2, { isStatic: true, label: 'wall-right' }),
    ],
  };
}

const TemplatePhysicsDrop = memo(function TemplatePhysicsDrop() {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const expandedRef = useRef<number | null>(null);
  const physicsPausedRef = useRef(false);
  const pairsRef = useRef<BodyPair[]>([]);
  const dismissTimerRef = useRef<number | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ExpandAnchor | null>(null);
  const reduceMotion = useSyncExternalStore(subscribeReduceMotion, getReduceMotion, getServerReduceMotion);
  const metrics = useMemo(() => resumeTemplates.map((t) => getPhysicsCardMetrics(t)), []);
  const rowStride = useMemo(() => {
    const maxH = metrics.reduce((m, x) => Math.max(m, x.bodyH), 180);
    return maxH + 28;
  }, [metrics]);

  useLayoutEffect(() => {
    if (reduceMotion) return;
    const container = containerRef.current;
    if (!container) return;

    let raf = 0;
    let disposed = false;
    const engine = Engine.create({
      gravity: { x: 0, y: 1.45, scale: 0.001 },
    });
    const pairs: BodyPair[] = [];
    pairsRef.current = pairs;
    const staticBodies: Matter.Body[] = [];

    const spawnBody = (i: number, spawn: ReturnType<typeof buildSpawnPositions>[number]) => {
      const template = resumeTemplates[i]!;
      const { bodyW, bodyH } = metrics[i] ?? getPhysicsCardMetrics(template);
      const body = Bodies.rectangle(spawn.x, spawn.y, bodyW, bodyH, {
        restitution: 0.32,
        friction: 0.48,
        frictionStatic: 0.72,
        frictionAir: 0.014,
        chamfer: { radius: 6 },
        label: template.id,
      });
      Body.setAngle(body, spawn.angle);
      Body.setVelocity(body, { x: spawn.vx, y: spawn.vy });
      Body.setAngularVelocity(body, spawn.angularVelocity);
      World.add(engine.world, body);
      pairs[i] = { body, w: bodyW, h: bodyH };
    };

    const mount = () => {
      Composite.clear(engine.world, false);
      Engine.clear(engine);
      pairs.length = 0;
      staticBodies.length = 0;

      const viewW = container.clientWidth;
      const viewH = container.clientHeight;
      if (viewW <= 0 || viewH <= 0) return;

      resumeTemplates.forEach((_, i) => {
        pairs[i] = {
          body: null,
          w: metrics[i]?.bodyW ?? getPhysicsCardMetrics(resumeTemplates[i]!).bodyW,
          h: metrics[i]?.bodyH ?? getPhysicsCardMetrics(resumeTemplates[i]!).bodyH,
        };
        const el = itemRefs.current[i];
        if (el) el.style.visibility = 'hidden';
      });

      const { bounds } = buildBounds(viewW, viewH);
      staticBodies.push(...bounds);
      World.add(engine.world, bounds);

      const spawns = buildSpawnPositions(resumeTemplates.length, viewW, rowStride);
      spawns.forEach((spawn, i) => {
        if (physicsPausedRef.current) return;
        spawnBody(i, spawn);
      });
    };

    mount();

    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      mount();
      raf = requestAnimationFrame(tick);
    });
    ro.observe(container);

    const tick = () => {
      if (disposed) return;
      if (!physicsPausedRef.current) {
        Engine.update(engine, FIXED_DT);
        for (const pair of pairs) {
          if (pair?.body) uprightClamp(pair.body);
        }
        syncDom(pairs, itemRefs);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      Composite.clear(engine.world, false);
      Engine.clear(engine);
    };
  }, [metrics, reduceMotion, rowStride]);

  const itemShellClass =
    'absolute left-0 top-0 origin-center overflow-hidden cursor-pointer transition-opacity duration-200 ease-out will-change-transform';

  const itemShellStyle = (templateId: string, i: number) => {
    const isHovered = hoveredId === templateId;
    const dimmed = hoveredId !== null && !isHovered;
    return {
      width: metrics[i]?.bodyW,
      height: metrics[i]?.bodyH,
      opacity: dimmed ? DIMMED_OPACITY : DEFAULT_OPACITY,
      zIndex: isHovered ? 30 : 1,
    };
  };

  const clearHover = () => setHoveredId(null);

  const pausePhysics = useCallback((paused: boolean) => {
    physicsPausedRef.current = paused;
    if (paused) freezePhysicsBodies(pairsRef.current);
  }, []);

  const openExpand = useCallback((i: number) => {
    if (expandedRef.current !== null) return;
    const el = itemRefs.current[i];
    if (!el) return;
    pausePhysics(true);
    expandedRef.current = i;
    setHoveredId(null);
    const template = resumeTemplates[i]!;
    const { bodyW, bodyH } = getPhysicsCardMetrics(template);
    const container = containerRef.current;
    const fromFrame = reduceMotion
      ? captureExpandFromLayout(el, bodyW, bodyH)
      : captureExpandFromPhysics(
          el.style.transform,
          bodyW,
          bodyH,
          container
            ? { left: container.getBoundingClientRect().left, top: container.getBoundingClientRect().top }
            : undefined,
        );
    setExpanded({ index: i, fromFrame });
  }, [pausePhysics, reduceMotion]);

  const hideOriginalForClone = useCallback(() => {
    const i = expandedRef.current;
    if (i == null) return;
    const el = itemRefs.current[i];
    if (!el) return;
    el.style.opacity = '0';
    el.style.pointerEvents = 'none';
  }, []);

  const handleExpandClosed = useCallback(() => {
    const i = expandedRef.current;
    if (i != null) {
      const el = itemRefs.current[i];
      if (el) {
        el.style.opacity = '';
        el.style.pointerEvents = '';
      }
    }
    pausePhysics(false);
    if (dismissTimerRef.current) window.clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = window.setTimeout(() => {
      dismissTimerRef.current = null;
      expandedRef.current = null;
      setExpanded(null);
    }, OVERLAY_DISMISS_MS);
  }, [pausePhysics]);

  useEffect(() => () => {
    if (dismissTimerRef.current) window.clearTimeout(dismissTimerRef.current);
  }, []);

  const renderItem = (template: (typeof resumeTemplates)[number], i: number, shellClass: string, extraStyle?: CSSProperties) => (
    <div
      key={template.id}
      data-physics-item
      ref={(el) => {
        itemRefs.current[i] = el;
      }}
      className={shellClass}
      style={{ ...itemShellStyle(template.id, i), ...extraStyle }}
      onMouseEnter={() => {
        if (expandedRef.current === null) setHoveredId(template.id);
      }}
      onMouseLeave={(e) => clearHoverUnlessSibling(e, clearHover)}
      onClick={() => openExpand(i)}
    >
      <PhysicsTemplateCard template={template} />
    </div>
  );

  if (reduceMotion) {
    return (
      <>
        <div
          ref={containerRef}
          className='absolute inset-0 overflow-hidden'
          onMouseLeave={clearHover}
        >
          <div className='flex h-full flex-wrap content-end gap-3 p-4 pb-6'>
            {resumeTemplates.map((template, i) => (
              <div
                key={template.id}
                data-physics-item
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                className='cursor-pointer transition-opacity duration-200 ease-out'
                style={itemShellStyle(template.id, i)}
                onMouseEnter={() => {
                  if (expandedRef.current === null) setHoveredId(template.id);
                }}
                onMouseLeave={(e) => clearHoverUnlessSibling(e, clearHover)}
                onClick={() => openExpand(i)}
              >
                <PhysicsTemplateCard template={template} />
              </div>
            ))}
          </div>
        </div>
        {expanded ? (
          <ResumeExpandOverlay
            anchor={expanded}
            template={resumeTemplates[expanded.index]!}
            reduceMotion={reduceMotion}
            onHideOriginal={hideOriginalForClone}
            onClosed={handleExpandClosed}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className='absolute inset-0 overflow-hidden'
        onMouseLeave={clearHover}
      >
        {resumeTemplates.map((template, i) =>
          renderItem(template, i, itemShellClass, { visibility: 'hidden' }),
        )}
      </div>
      {expanded ? (
        <ResumeExpandOverlay
          anchor={expanded}
          template={resumeTemplates[expanded.index]!}
          reduceMotion={reduceMotion}
          onHideOriginal={hideOriginalForClone}
          onClosed={handleExpandClosed}
        />
      ) : null}
    </>
  );
});

export default TemplatePhysicsDrop;
