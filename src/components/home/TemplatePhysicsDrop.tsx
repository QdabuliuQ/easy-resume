'use client';

import type { ResumeTemplateItem } from '@/json/resumeTemplates';
import { buildSpawnPositions } from '@/lib/home/buildSpawnPositions';
import {
  captureExpandFromLayout,
  captureExpandFromPhysics,
} from '@/lib/home/expandedResumeLayout';
import { clampResumeTilt, MAX_RESUME_TILT } from '@/lib/home/resumeTiltLimits';
import {
  getPhysicsPaused,
  setPhysicsPause,
  subscribePhysicsPause,
} from '@/lib/home/physicsPauseStore';
import { buildHomePlaceholderTemplates } from '@/lib/home/templateHomePlaceholders';
import { getHomeTemplateCatalog } from '@/lib/home/templateHomeCatalog';
import { prefetchHomeExpandThumb } from '@/lib/cdnThumbUrl';
import Matter from 'matter-js';
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import PhysicsTemplateCard, { getPhysicsCardMetrics } from './PhysicsTemplateCard';
import ResumeExpandOverlay, { type ExpandAnchor } from './ResumeExpandOverlay';

const { Engine, Bodies, Body, Composite, World } = Matter;

const WALL = 80;
const GROUND_INSET = 12;
const OVERLAY_DISMISS_MS = 100;
const FIXED_DT = 1000 / 60;
const DIMMED_OPACITY = 0.32;
/** ponytail: 拖拽缩放窗口时 ResizeObserver 连发，防抖后再 remount */
const RESIZE_DEBOUNCE_MS = 200;

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

function syncDom(
  pairs: BodyPair[],
  itemRefs: { current: (HTMLDivElement | null)[] },
  hoverIndex: number | null,
) {
  for (let i = 0; i < pairs.length; i++) {
    const el = itemRefs.current[i];
    const pair = pairs[i];
    if (!el || !pair?.body) continue;
    const { x, y } = pair.body.position;
    const angle = pair.body.angle;
    el.style.visibility = 'visible';
    if (hoverIndex === null) {
      el.style.opacity = '1';
    } else {
      el.style.opacity = i === hoverIndex ? '1' : String(DIMMED_OPACITY);
    }
    el.style.pointerEvents = 'auto';
    el.style.transform = `translate3d(${x - pair.w / 2}px, ${y - pair.h / 2}px, 0) rotate(${angle}rad)`;
  }
}

function applyItemHoverVisual(
  itemRefs: { current: (HTMLDivElement | null)[] },
  hoverIndex: number | null,
) {
  for (let i = 0; i < itemRefs.current.length; i++) {
    const el = itemRefs.current[i];
    if (!el) continue;
    if (hoverIndex === null) {
      el.style.removeProperty('opacity');
      el.style.removeProperty('z-index');
      continue;
    }
    const active = i === hoverIndex;
    el.style.opacity = active ? '1' : String(DIMMED_OPACITY);
    el.style.zIndex = active ? '30' : '1';
  }
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

const TemplatePhysicsDrop = memo(function TemplatePhysicsDrop({ reduceMotion }: { reduceMotion: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const expandedRef = useRef<number | null>(null);
  const physicsPausedRef = useRef(getPhysicsPaused());
  const loopRef = useRef<{ raf: number; disposed: boolean; tick: () => void } | null>(null);
  const pairsRef = useRef<BodyPair[]>([]);
  const dismissTimerRef = useRef<number | null>(null);
  const hoveredIndexRef = useRef<number | null>(null);
  const [templates, setTemplates] = useState(buildHomePlaceholderTemplates);
  const [expanded, setExpanded] = useState<ExpandAnchor | null>(null);
  const metrics = useMemo(() => templates.map((t) => getPhysicsCardMetrics(t)), [templates]);
  const rowStride = useMemo(() => {
    const maxH = metrics.reduce((m, x) => Math.max(m, x.bodyH), 180);
    return maxH + 28;
  }, [metrics]);

  useEffect(() => {
    let cancelled = false;
    void getHomeTemplateCatalog().then((list) => {
      if (!cancelled && list.length) setTemplates(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useLayoutEffect(() => {
    if (reduceMotion || !templates.length) return;
    const container = containerRef.current;
    if (!container) return;

    const engine = Engine.create({
      gravity: { x: 0, y: 1.45, scale: 0.001 },
    });
    const pairs: BodyPair[] = [];
    pairsRef.current = pairs;
    const staticBodies: Matter.Body[] = [];

    const spawnBody = (i: number, spawn: ReturnType<typeof buildSpawnPositions>[number]) => {
      const template = templates[i]!;
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

      templates.forEach((_, i) => {
        pairs[i] = {
          body: null,
          w: metrics[i]?.bodyW ?? getPhysicsCardMetrics(templates[i]!).bodyW,
          h: metrics[i]?.bodyH ?? getPhysicsCardMetrics(templates[i]!).bodyH,
        };
        const el = itemRefs.current[i];
        if (el) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
        }
      });

      const { bounds } = buildBounds(viewW, viewH);
      staticBodies.push(...bounds);
      World.add(engine.world, bounds);

      const spawns = buildSpawnPositions(templates.length, viewW, rowStride);
      spawns.forEach((spawn, i) => {
        spawnBody(i, spawn);
      });
      // 始终 sync 一次；暂停只冻速度，避免 DOM 一直 hidden 导致不拉预览图
      syncDom(pairs, itemRefs, hoveredIndexRef.current);
      if (physicsPausedRef.current) {
        freezePhysicsBodies(pairs);
      }
    };

    mount();
    let lastViewW = container.clientWidth;
    let lastViewH = container.clientHeight;
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;

    const remountIfSizeChanged = () => {
      const viewW = container.clientWidth;
      const viewH = container.clientHeight;
      if (viewW <= 0 || viewH <= 0) return;
      if (viewW === lastViewW && viewH === lastViewH) return;
      lastViewW = viewW;
      lastViewH = viewH;
      const loop = loopRef.current;
      if (loop?.raf) cancelAnimationFrame(loop.raf);
      mount();
      if (!physicsPausedRef.current && loop && !loop.disposed) {
        loop.raf = requestAnimationFrame(tick);
      }
    };

    const ro = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeTimer = undefined;
        remountIfSizeChanged();
      }, RESIZE_DEBOUNCE_MS);
    });
    ro.observe(container);

    const tick = () => {
      const loop = loopRef.current;
      if (!loop || loop.disposed) return;
      if (physicsPausedRef.current) {
        loop.raf = 0;
        return;
      }
      Engine.update(engine, FIXED_DT);
      for (const pair of pairs) {
        if (pair?.body) uprightClamp(pair.body);
      }
      syncDom(pairs, itemRefs, hoveredIndexRef.current);
      loop.raf = requestAnimationFrame(tick);
    };

    const loop = { raf: 0, disposed: false, tick };
    loopRef.current = loop;
    if (!physicsPausedRef.current) {
      loop.raf = requestAnimationFrame(tick);
    }

    return () => {
      loop.disposed = true;
      loopRef.current = null;
      if (loop.raf) cancelAnimationFrame(loop.raf);
      if (resizeTimer) clearTimeout(resizeTimer);
      ro.disconnect();
      Composite.clear(engine.world, false);
      Engine.clear(engine);
    };
  }, [metrics, reduceMotion, rowStride, templates]);

  useEffect(() => {
    if (reduceMotion) return;
    // HMR / unclean overlay unmount can leave expand stuck in the module store
    setPhysicsPause('expand', false);
    const syncPause = () => {
      const wasPaused = physicsPausedRef.current;
      physicsPausedRef.current = getPhysicsPaused();
      const loop = loopRef.current;
      if (physicsPausedRef.current) {
        freezePhysicsBodies(pairsRef.current);
        if (loop?.raf) {
          cancelAnimationFrame(loop.raf);
          loop.raf = 0;
        }
        return;
      }
      if (wasPaused && loop && !loop.disposed && !loop.raf) {
        loop.raf = requestAnimationFrame(loop.tick);
      }
    };
    syncPause();
    const unsub = subscribePhysicsPause(syncPause);
    return () => {
      setPhysicsPause('expand', false);
      unsub();
    };
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    const onVisibility = () => setPhysicsPause('hidden', document.hidden);
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      setPhysicsPause('hidden', false);
    };
  }, [reduceMotion]);

  const itemShellClass =
    'absolute left-0 top-0 origin-center overflow-hidden cursor-pointer transition-opacity duration-200 ease-out';

  const itemShellStyle = (i: number) => ({
    width: metrics[i]?.bodyW,
    height: metrics[i]?.bodyH,
    zIndex: 1,
  });

  const clearHover = useCallback(() => {
    hoveredIndexRef.current = null;
    for (let i = 0; i < itemRefs.current.length; i++) {
      const el = itemRefs.current[i];
      if (!el) continue;
      el.style.opacity = '1';
      el.style.removeProperty('z-index');
    }
  }, []);

  const onItemPointerEnter = useCallback((i: number) => {
    if (expandedRef.current !== null) return;
    hoveredIndexRef.current = i;
    applyItemHoverVisual(itemRefs, i);
    const url = templates[i]?.previewImage?.trim();
    if (url) prefetchHomeExpandThumb(url);
  }, [templates]);

  const onItemPointerLeave = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const next = e.relatedTarget;
    if (next instanceof Element && next.closest('[data-physics-item]')) return;
    clearHover();
  }, [clearHover]);

  const captureItemFrame = useCallback(
    (i: number) => {
      const el = itemRefs.current[i];
      const template = templates[i];
      if (!el || !template?.config) return null;
      const { bodyW, bodyH } = getPhysicsCardMetrics(template);
      const container = containerRef.current;
      return reduceMotion
        ? captureExpandFromLayout(el, bodyW, bodyH)
        : captureExpandFromPhysics(
            el.style.transform,
            bodyW,
            bodyH,
            container
              ? { left: container.getBoundingClientRect().left, top: container.getBoundingClientRect().top }
              : undefined,
          );
    },
    [reduceMotion, templates],
  );

  const openExpand = useCallback(
    (i: number) => {
      if (expandedRef.current !== null) return;
      const fromFrame = captureItemFrame(i);
      if (!fromFrame) return;
      setPhysicsPause('expand', true);
      expandedRef.current = i;
      clearHover();
      setExpanded({ index: i, fromFrame });
    },
    [captureItemFrame, clearHover],
  );

  const hideOriginalForClone = useCallback(() => {
    const i = expandedRef.current;
    if (i == null) return;
    const el = itemRefs.current[i];
    if (!el) return;
    el.style.transition = 'none';
    el.style.opacity = '0';
    el.style.pointerEvents = 'none';
  }, []);

  const navigateExpand = useCallback((nextIndex: number) => {
    const prevIndex = expandedRef.current;
    if (prevIndex === null || prevIndex === nextIndex) return;
    if (nextIndex < 0 || nextIndex >= templates.length) return;
    const prevEl = itemRefs.current[prevIndex];
    if (prevEl) {
      prevEl.style.transition = 'none';
      prevEl.style.removeProperty('opacity');
      prevEl.style.removeProperty('pointer-events');
      void prevEl.offsetHeight;
      prevEl.style.removeProperty('transition');
    }
    const fromFrame = captureItemFrame(nextIndex);
    if (!fromFrame) return;
    expandedRef.current = nextIndex;
    const nextEl = itemRefs.current[nextIndex];
    if (nextEl) {
      nextEl.style.transition = 'none';
      nextEl.style.opacity = '0';
      nextEl.style.pointerEvents = 'none';
    }
    setExpanded({ index: nextIndex, fromFrame });
  }, [captureItemFrame]);

  const handleExpandClosed = useCallback(({ hideClone }: { hideClone: () => void }) => {
    hideClone();
    const i = expandedRef.current;
    if (i != null) {
      const el = itemRefs.current[i];
      if (el) {
        el.style.transition = 'none';
        el.style.removeProperty('opacity');
        el.style.removeProperty('pointer-events');
        void el.offsetHeight;
        el.style.removeProperty('transition');
      }
    }
    setPhysicsPause('expand', false);
    if (dismissTimerRef.current) window.clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = window.setTimeout(() => {
      dismissTimerRef.current = null;
      expandedRef.current = null;
      setExpanded(null);
    }, OVERLAY_DISMISS_MS);
  }, []);

  useEffect(() => () => {
    if (dismissTimerRef.current) window.clearTimeout(dismissTimerRef.current);
    clearHover();
  }, [clearHover]);

  const staticItemClass = 'cursor-pointer transition-opacity duration-200 ease-out';

  const renderItem = (template: ResumeTemplateItem, i: number, shellClass: string, extraStyle?: CSSProperties) => (
    <div
      key={template.id}
      data-physics-item
      ref={(el) => {
        itemRefs.current[i] = el;
      }}
      className={shellClass}
      style={{ ...itemShellStyle(i), ...extraStyle }}
      onPointerEnter={() => onItemPointerEnter(i)}
      onPointerLeave={onItemPointerLeave}
      onClick={() => openExpand(i)}
    >
      <PhysicsTemplateCard template={template} />
    </div>
  );

  const expandedTemplate = expanded ? templates[expanded.index] : undefined;
  const expandedOverlay =
    expanded && expandedTemplate ? (
      <ResumeExpandOverlay
        anchor={expanded}
        template={expandedTemplate}
        totalCount={templates.length}
        reduceMotion={reduceMotion}
        onHideOriginal={hideOriginalForClone}
        onNavigate={navigateExpand}
        onClosed={handleExpandClosed}
      />
    ) : null;

  if (reduceMotion) {
    return (
      <>
        <div ref={containerRef} className='absolute inset-0 overflow-hidden' onMouseLeave={clearHover}>
          <div className='flex h-full flex-wrap content-end gap-3 p-4 pb-6'>
            {templates.map((template, i) => renderItem(template, i, staticItemClass))}
          </div>
        </div>
        {expandedOverlay}
      </>
    );
  }

  return (
    <>
      <div ref={containerRef} className='absolute inset-0 overflow-hidden' onMouseLeave={clearHover}>
        {templates.map((template, i) =>
          renderItem(template, i, itemShellClass, { opacity: 0, pointerEvents: 'none' }),
        )}
      </div>
      {expandedOverlay}
    </>
  );
});

export default TemplatePhysicsDrop;
