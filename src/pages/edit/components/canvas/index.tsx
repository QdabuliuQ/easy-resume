import { memo, useEffect, useRef, useState } from 'react';
import { useMemoizedFn } from 'ahooks';
import styles from './index.module.less';

import resume from '@/json/resume';

import { observer } from 'mobx-react';
import {
  Certificate,
  Info1,
  Job,
  Margin,
  Page,
  Project,
  Skill,
  Education,
} from '@/modules';
import { createRoot } from 'react-dom/client';
import { configStore } from '@/mobx';
import { getRandomId } from '@/utils';

function Canvas() {
  const moduleHeights = useRef<{ [propName: string]: number }>({});

  const measureComponentHeight = useMemoizedFn(
    (Component: React.ComponentType<any>, props: any): Promise<Array<any>> => {
      return new Promise((resolve) => {
        // 创建一个隐藏的 div
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.visibility = 'hidden';
        container.style.pointerEvents = 'none';
        container.style.height = 'auto';
        container.style.width = 'auto';
        document.body.appendChild(container);
        const module = <Component {...props} key={getRandomId()} />;

        // 渲染组件
        const root = createRoot(container);
        root.render(module);

        // 等待渲染完成后测量
        setTimeout(() => {
          const height = container.offsetHeight;
          console.log(height, 'height', props);
          
          // 卸载并移除
          root.unmount();
          document.body.removeChild(container);
          resolve([height, module]);
        }, 0); // 0ms，等下一帧
      });
    }
  );

  const computeLayout = useMemoizedFn(
    async (components: Array<any>, resume: any, update: boolean = true) => {
      let { height: pageHeight, verticalMargin } = resume.globalStyle;
      const newPages: Array<Array<any>> = [[]];
      let height = 0;
      let currentIndex = 1;
      pageHeight = pageHeight - verticalMargin * 2;
      for (const component of components) {
        if (!component) {
          continue;
        }

        const moduleHeight = moduleHeights.current[component.props.config.id];
        if (height + moduleHeight > pageHeight) {
          currentIndex++;
          height = moduleHeight;
          newPages.push([component]);
        } else {
          if (newPages[newPages.length - 1].length !== 0) {
            newPages[newPages.length - 1].push(
              <Margin
                key={`margin-${height}`}
                height={resume.pages[currentIndex - 1]?.moduleMargin ?? 10}
              />
            );
          }
          newPages[newPages.length - 1].push(component);
          height +=
            moduleHeight + (resume.pages[currentIndex - 1]?.moduleMargin ?? 10);
        }
      }
      const allPages: Array<React.ReactNode> = [];

      currentIndex = 1;
      for (const page of newPages) {
        const pageModules: Array<any> = [];
        for (const module of page) {
          pageModules.push(module);
        }
        console.log(resume.globalStyle, 'resume.globalStyle');
        allPages.push(
          <div key={currentIndex++} className={styles.pageContainer}>
            <Page {...resume.globalStyle}>{pageModules}</Page>
          </div>
        );
      }

      setPages(allPages);
      const config: any = {
        globalStyle: resume.globalStyle,
        pages: [],
      };
      currentIndex = 1;
      for (const page of allPages) {
        config.pages.push({
          moduleMargin: resume.pages[currentIndex - 1]?.moduleMargin ?? 10,
          modules: [],
        });
        for (const item of (page as any).props.children.props.children) {
          if (item.props.config) {
            config.pages[currentIndex - 1].modules.push(
              JSON.parse(JSON.stringify(item.props.config))
            );
          }
        }
        currentIndex++;
      }
      if (update) {
        configStore.setConfig(config);
      }
    }
  );

  const [pages, setPages] = useState<Array<React.ReactNode>>([]);
  const render = useMemoizedFn(async (resume: any, update: boolean = true) => {
    const allModules: Array<React.ReactNode> = [];
    moduleHeights.current = {};
    for (let i = 0; i < resume.pages.length; i++) {
      const item = resume.pages[i];
      // const currentPage = [];
      for (const module of item.modules) {
        let component = null;
        let height = 0;
        if (module.type === 'info1') {
          [height, component] = await measureComponentHeight(Info1, {
            key: module.id,
            config: module,
            globalStyle: resume.globalStyle,
          });
        } else if (module.type === 'certificate') {
          [height, component] = await measureComponentHeight(Certificate, {
            key: module.id,
            config: module,
            globalStyle: resume.globalStyle,
          });
        } else if (module.type === 'skill') {
          [height, component] = await measureComponentHeight(Skill, {
            key: module.id,
            config: module,
            globalStyle: resume.globalStyle,
          });
        } else if (module.type === 'job') {
          [height, component] = await measureComponentHeight(Job, {
            key: module.id,
            config: module,
            globalStyle: resume.globalStyle,
          });
        } else if (module.type === 'project') {
          [height, component] = await measureComponentHeight(Project, {
            key: module.id,
            config: module,
            globalStyle: resume.globalStyle,
          });
        } else if (module.type === 'education') {
          [height, component] = await measureComponentHeight(Education, {
            key: module.id,
            config: module,
            globalStyle: resume.globalStyle,
          });
        }
        moduleHeights.current[module.id] = height;
        allModules.push(component);
      }
    }
    computeLayout(allModules, resume, update);
    // setPages(allPages);
  });

  useEffect(() => {
    render(resume);
  }, [resume]);

  useEffect(() => {
    if (configStore.getConfig) {
      render(configStore.getConfig, false);
    }
  }, [configStore.getConfig]);

  return (
    <div className='w-full mt-[20px] rounded-md overflow-hidden'>{pages}</div>
  );
}

export default memo(observer(Canvas));
