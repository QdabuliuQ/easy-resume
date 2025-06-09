import { memo, useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { useMemoizedFn, useMount } from 'ahooks';
import createSkillModule from '@/modules/skill';
import createJobModule from '@/modules/job';
import createEducationModule from '@/modules/education';
import createCertificateModule from '@/modules/certificate';
import createInfo1 from '@/modules/info/info1';
import createProjectModule from '@/modules/project';
import { observer } from 'mobx-react';

import resume from '@/json/resume';

import { moduleActiveStore, configStore } from '@/mobx';

import styles from './index.module.less';

function Canvas() {
  const canvasInstanceRef = useRef<Array<fabric.Canvas> | null>([]);

  // 重置dom
  const createCanvasDom = useMemoizedFn(
    (width: number, height: number, index: number, canvasBox: HTMLElement) => {
      const canvas: any = document.createElement('canvas');
      canvas.id = 'canvas-' + index;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = width;
      canvas.height = height;
      canvasBox.appendChild(canvas);
    }
  );

  useEffect(() => {
    console.log('123123', configStore.getConfig);
  }, [configStore.getConfig]);

  useMount(async () => {
    const canvasBox = document.getElementById('canvas-box');
    if (!canvasBox) return;
    const pages = []; // 页面布局
    canvasBox.innerHTML = '';
    canvasInstanceRef.current = [];
    const modules = [];
    for (const element of resume.pages) {
      for (const item of element.modules) {
        modules.push(item);
      }
    }
    let index = 1;
    let height = 0;
    createCanvasDom(
      resume.globalStyle.width,
      resume.globalStyle.height,
      index,
      canvasBox
    );
    let canvas = new fabric.Canvas('canvas-' + index, {
      hoverCursor: 'pointer',
      backgroundColor: resume.globalStyle.backgroundColor,
    });
    // 一开始选中
    canvas.on('selection:created', ({ selected }: any) => {
      moduleActiveStore.setModuleActive(selected[0].property.id);
    });

    // 选中
    canvas.on('selection:updated', ({ selected }: any) => {
      moduleActiveStore.setModuleActive(selected[0].property.id);
    });

    // 取消选中
    canvas.on('selection:cleared', () => {
      moduleActiveStore.setModuleActive('');
    });

    canvasInstanceRef.current.push(canvas);

    let currentPage = 1;
    for (let i = 0; i < modules.length; i++) {
      const options = modules[i];
      options._options = {
        ...options.options,
        ...resume.globalStyle,
      };
      let module: fabric.Group | null = null;
      if (options.type === 'skill') {
        module = createSkillModule(options._options);
      } else if (options.type === 'job') {
        module = createJobModule(options._options);
      } else if (options.type === 'education') {
        module = createEducationModule(options._options);
      } else if (options.type === 'certificate') {
        module = createCertificateModule(options._options);
      } else if (options.type === 'info1') {
        module = await createInfo1(options._options);
      } else if (options.type === 'project') {
        module = createProjectModule(options._options);
      }

      if (module) {
        if (
          ((module as fabric.Group).height ?? 0) +
            ((module as fabric.Group).top ?? 0) +
            height >
          resume.globalStyle.height - resume.globalStyle.verticalMargin * 2
        ) {
          index++;
          createCanvasDom(
            resume.globalStyle.width,
            resume.globalStyle.height,
            index,
            canvasBox
          );
          canvas.renderAll();
          canvas = new fabric.Canvas('canvas-' + index, {
            hoverCursor: 'pointer',
            backgroundColor: resume.globalStyle.backgroundColor,
          });
          canvasInstanceRef.current.push(canvas);
          canvas.add(module);
          module.set({
            top: resume.globalStyle.verticalMargin,
          });
          module.setCoords();
          height =
            ((module as fabric.Group).height ?? 0) +
            ((module as fabric.Group).top ?? 0); //
          // 一开始选中
          canvas.on('selection:created', ({ selected }: any) => {
            moduleActiveStore.setModuleActive(selected[0].property.id);
          });

          // 选中
          canvas.on('selection:updated', ({ selected }: any) => {
            moduleActiveStore.setModuleActive(selected[0].property.id);
          });

          // 取消选中
          canvas.on('selection:cleared', () => {
            moduleActiveStore.setModuleActive('');
          });

          currentPage++;
          delete options._options;
          pages.push({
            moduleMargin: resume.pages[currentPage]?.moduleMargin ?? 10,
            modules: [options],
          });
        } else {
          canvas.add(module);
          module.set({
            top:
              i === 0
                ? resume.globalStyle.verticalMargin
                : height + (resume.pages[currentPage]?.moduleMargin ?? 10),
          });
          module.setCoords();
          height =
            ((module as fabric.Group).height ?? 0) +
            ((module as fabric.Group).top ?? 0);
          delete options._options;
          if (!pages.length) {
            pages.push({
              moduleMargin: resume.pages[currentPage]?.moduleMargin ?? 10,
              modules: [options],
            });
          } else {
            (pages[pages.length - 1] as any).modules.push(options);
          }
        }
      }
    }
    resume.pages = pages;
    configStore.setConfig(JSON.parse(JSON.stringify(resume)));
  });

  return (
    <div className='w-full mt-[20px] rounded-md overflow-hidden'>
      <div id='canvas-box' className={styles['canvas-box']}></div>
    </div>
  );
}

export default memo(observer(Canvas));
