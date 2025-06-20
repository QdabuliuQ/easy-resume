import { moduleActiveStore, configStore } from '@/mobx';
import createCertificateModule from '@/modules/certificate';
import createEducationModule from '@/modules/tmp/education';
import createInfo1 from '@/modules/info/info1';
import createJobModule from '@/modules/tmp/job';
import createProjectModule from '@/modules/tmp/project';
import createSkillModule from '@/modules/tmp/skill';
import { useMemoizedFn } from 'ahooks';
import { fabric } from 'fabric';

let canvasInstanceRef: Array<fabric.Canvas> = [];

// 重置dom
function createCanvasDom(
  width: number,
  height: number,
  index: number,
  canvasBox: HTMLElement
) {
  const canvas: any = document.createElement('canvas');
  canvas.id = 'canvas-' + index;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = width;
  canvas.height = height;
  canvasBox.appendChild(canvas);
}

export const useRender = () => {
  const render = useMemoizedFn(async (resume: any, init: boolean = false) => {
    let currentPage = 1;
    for (let i = 0; i < canvasInstanceRef.length; i++) {
      canvasInstanceRef[i].clear();
    }
    const canvasBox = document.getElementById('canvas-box') as HTMLElement;
    if (init) {
      if (!canvasBox) return;
      canvasBox.innerHTML = '';
      canvasInstanceRef = [];

      createCanvasDom(
        resume.globalStyle.width,
        resume.globalStyle.height,
        currentPage,
        canvasBox
      );
      let canvas = new fabric.Canvas('canvas-' + currentPage, {
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
        moduleActiveStore.setModuleActive('global');
        console.log('取消');
      });

      canvasInstanceRef.push(canvas);
    }

    const pages = []; // 页面布局
    let height = 0;
    const modules = [];
    for (const element of resume.pages) {
      for (const item of element.modules) {
        modules.push(item);
      }
    }
    for (let i = 0; i < modules.length; i++) {
      const options = modules[i];

      let module: fabric.Group | null = null;
      if (options.type === 'skill') {
        module = createSkillModule(options, resume.globalStyle);
      } else if (options.type === 'job') {
        module = createJobModule(options, resume.globalStyle);
      } else if (options.type === 'education') {
        module = createEducationModule(options, resume.globalStyle);
      } else if (options.type === 'certificate') {
        module = createCertificateModule(options, resume.globalStyle);
      } else if (options.type === 'info1') {
        module = (await createInfo1(
          options,
          resume.globalStyle
        )) as fabric.Group;
      } else if (options.type === 'project') {
        module = createProjectModule(options, resume.globalStyle);
      }

      if (module) {
        if (
          ((module as fabric.Group).height ?? 0) +
            ((module as fabric.Group).top ?? 0) +
            height >
          resume.globalStyle.height - resume.globalStyle.verticalMargin * 2
        ) {
          currentPage++;

          createCanvasDom(
            resume.globalStyle.width,
            resume.globalStyle.height,
            currentPage,
            canvasBox
          );
          if (canvasInstanceRef) {
            canvasInstanceRef[currentPage - 2].renderAll();

            const canvas = new fabric.Canvas('canvas-' + currentPage, {
              hoverCursor: 'pointer',
              backgroundColor: resume.globalStyle.backgroundColor,
            });
            canvasInstanceRef.push(canvas);
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

            delete options._options;
            pages.push({
              moduleMargin: resume.pages[currentPage - 1]?.moduleMargin ?? 10,
              modules: [options],
            });
          }
        } else {
          if (canvasInstanceRef) {
            canvasInstanceRef[currentPage - 1].add(module);
            module.set({
              top:
                i === 0
                  ? resume.globalStyle.verticalMargin
                  : height +
                    (resume.pages[currentPage - 1]?.moduleMargin ?? 10),
            });
            module.setCoords();
            height =
              ((module as fabric.Group).height ?? 0) +
              ((module as fabric.Group).top ?? 0);
            delete options._options;
            if (!pages.length) {
              pages.push({
                moduleMargin: resume.pages[currentPage - 1]?.moduleMargin ?? 10,
                modules: [options],
              });
            } else {
              (pages[pages.length - 1] as any).modules.push(options);
            }
          }
        }
      }
    }
    resume.pages = pages;
    configStore.setConfig(JSON.parse(JSON.stringify(resume)));
  });

  return {
    render,
    canvasInstanceRef,
  };
};

function getModuleInstance(
  id: string,
  canvasInstanceRef: Array<fabric.Canvas>
) {
  for (let i = 0; i < canvasInstanceRef.length; i++) {
    const canvas = canvasInstanceRef[i];
    const module = canvas
      .getObjects()
      .find((item: any) => item.property.id === id);
    if (module) {
      return module;
    }
  }
  return null;
}

export const update = async (resume: any) => {
  const canvasBox = document.getElementById('canvas-box') as HTMLElement;
  const pages: Array<any> = []; // 页面布局
  const moduleInstances = [];
  const modules = [];
  for (const element of resume.pages) {
    for (const item of element.modules) {
      modules.push(item);
    }
  }

  // 清理已删除的模块
  for (let i = 0; i < canvasInstanceRef.length; i++) {
    const canvas = canvasInstanceRef[i];
    const objects = canvas.getObjects();
    for (let j = objects.length - 1; j >= 0; j--) {
      const obj = objects[j] as any;
      if (!modules.find((m) => m.id === obj.property?.id)) {
        canvas.remove(obj);
      }
    }
  }

  // 更新或创建模块
  for (let i = 0; i < modules.length; i++) {
    const options = modules[i];
    const module = getModuleInstance(options.id, canvasInstanceRef);
    if (module && (module as any).update) {
      // 更新现有模块
      (module as any).update(options, resume.globalStyle);
      moduleInstances.push({ module, isExist: true });
      module.set({
        left: module.left,
        top: module.top,
      });
    } else {
      // 创建新模块
      let module: fabric.Group | null = null;
      if (options.type === 'skill') {
        module = createSkillModule(options, resume.globalStyle);
      } else if (options.type === 'job') {
        module = createJobModule(options, resume.globalStyle);
      } else if (options.type === 'education') {
        module = createEducationModule(options, resume.globalStyle);
      } else if (options.type === 'certificate') {
        module = createCertificateModule(options, resume.globalStyle);
      } else if (options.type === 'info1') {
        module = (await createInfo1(
          options,
          resume.globalStyle
        )) as fabric.Group;
      } else if (options.type === 'project') {
        module = createProjectModule(options, resume.globalStyle);
      }
      if (module) {
        moduleInstances.push({ module, isExist: false });
      }
    }
  }

  // 重新布局和分页
  let height = 0;
  let currentPage = 1;
  let currentCanvas = canvasInstanceRef[0];

  for (let i = 0; i < moduleInstances.length; i++) {
    const { module, isExist } = moduleInstances[i];
    const moduleHeight =
      ((module as fabric.Group).height ?? 0) +
      ((module as fabric.Group).top ?? 0);

    // 检查是否需要新页
    if (
      height + moduleHeight >
      resume.globalStyle.height - resume.globalStyle.verticalMargin * 2
    ) {
      currentPage++;
      height = 0;

      // 创建新画布
      if (currentPage > canvasInstanceRef.length) {
        createCanvasDom(
          resume.globalStyle.width,
          resume.globalStyle.height,
          currentPage,
          canvasBox
        );
        currentCanvas = new fabric.Canvas('canvas-' + currentPage, {
          hoverCursor: 'pointer',
          backgroundColor: resume.globalStyle.backgroundColor,
        });
        canvasInstanceRef.push(currentCanvas);
      } else {
        currentCanvas = canvasInstanceRef[currentPage - 1];
      }
    }

    // 设置模块位置
    module.set({
      top:
        height +
        (height === 0
          ? resume.globalStyle.verticalMargin
          : (resume.pages[currentPage - 1]?.moduleMargin ?? 10)),
      left: resume.globalStyle.horizontalMargin,
    });

    // 添加到画布
    if (!isExist) {
      currentCanvas.add(module as fabric.Group);
    }

    height +=
      ((module as fabric.Group).top ?? 0) +
      ((module as fabric.Group).height ?? 0);

    // 更新页面数据
    if (!pages[currentPage - 1]) {
      pages[currentPage - 1] = {
        moduleMargin: resume.pages[currentPage - 1]?.moduleMargin ?? 10,
        modules: [],
      };
    }
    pages[currentPage - 1].modules.push(modules[i]);
  }

  // 更新配置
  resume.pages = pages;
  configStore.setConfig(JSON.parse(JSON.stringify(resume)));

  // 重新渲染所有画布
  canvasInstanceRef.forEach((canvas) => canvas.renderAll());
};

// export const useUpdate = async (resume: any) => {
//   const canvasBox = document.getElementById('canvas-box') as HTMLElement;
//   const pages = []; // 页面布局
//   const moduleInstances = [];
//   const modules = [];
//   for (const element of resume.pages) {
//     for (const item of element.modules) {
//       modules.push(item);
//     }
//   }

//   for (let i = 0; i < modules.length; i++) {
//     const options = modules[i];
//     const module = getModuleInstance(options.id, canvasInstanceRef);
//     if (module && (module as any).update) {
//       // 原有模块
//       (module as any).update(options, resume.globalStyle);
//       moduleInstances.push({ module, isExist: true });
//     } else {
//       // 新模块
//       let module: fabric.Group | null = null;
//       if (options.type === 'skill') {
//         module = createSkillModule(options, resume.globalStyle);
//       } else if (options.type === 'job') {
//         module = createJobModule(options, resume.globalStyle);
//       } else if (options.type === 'education') {
//         module = createEducationModule(options, resume.globalStyle);
//       } else if (options.type === 'certificate') {
//         module = createCertificateModule(options, resume.globalStyle);
//       } else if (options.type === 'info1') {
//         module = (await createInfo1(
//           options,
//           resume.globalStyle
//         )) as fabric.Group;
//       } else if (options.type === 'project') {
//         module = createProjectModule(options, resume.globalStyle);
//       }
//       if (module) {
//         moduleInstances.push({ module, isExist: false });
//       }
//     }
//   }

//   let height = 0;
//   let currentPage = 1;

//   for (let i = 0; i < moduleInstances.length; i++) {
//     const { module, isExist } = moduleInstances[i];
//     if (
//       ((module as fabric.Group).height ?? 0) +
//         ((module as fabric.Group).top ?? 0) +
//         height >
//       resume.globalStyle.height - resume.globalStyle.verticalMargin * 2
//     ) {
//       currentPage++;
//       // 创建dom画布
//       createCanvasDom(
//         resume.globalStyle.width,
//         resume.globalStyle.height,
//         currentPage,
//         canvasBox
//       );
//     }
//   }
// };
