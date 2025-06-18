import { memo, useEffect } from 'react';
import { useMount } from 'ahooks';

import resume from '@/json/resume';

import { moduleActiveStore, configStore } from '@/mobx';

import styles from './index.module.less';
import { useRender } from '@/hooks/render';
import { observer } from 'mobx-react';

function Canvas() {
  const { render, canvasInstanceRef } = useRender();

  useMount(() => {
    render(resume, true);
  });

  useEffect(() => {
    const config = configStore.getConfig;
    const moduleActive = moduleActiveStore.getModuleActive;
    if (
      !moduleActive ||
      !canvasInstanceRef ||
      !config ||
      moduleActive === 'global'
    )
      return;
    for (let i = 0; i < config.pages.length; i++) {
      for (let j = 0; j < config.pages[i].modules.length; j++) {
        if (config.pages[i].modules[j].id === moduleActive) {
          if (canvasInstanceRef) {
            const canvas = canvasInstanceRef[i];
            if (canvas) {
              canvas.setActiveObject(canvas.getObjects()[j]);
              canvas.renderAll();
              for (let k = 0; k < canvasInstanceRef.length; k++) {
                if (k !== j) {
                  canvasInstanceRef[k]?.discardActiveObject();
                  canvasInstanceRef[k]?.renderAll();
                }
              }
              return;
            }
          }
        }
      }
    }
  }, [moduleActiveStore.getModuleActive, canvasInstanceRef]);

  return (
    <div className='w-full mt-[20px] rounded-md overflow-hidden'>
      <div id='canvas-box' className={styles['canvas-box']}></div>
    </div>
  );
}

export default memo(observer(Canvas));
