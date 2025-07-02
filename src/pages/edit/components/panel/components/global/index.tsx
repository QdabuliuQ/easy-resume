import { memo, useEffect, useState } from 'react';

import { configStore } from '@/mobx';
import { observer } from 'mobx-react';
import { Col, ColorPicker, Form, InputNumber, Popconfirm, Row } from 'antd';
import styles from './index.module.less';
import { useDebounceFn, useMemoizedFn } from 'ahooks';
import Title from '@/components/title';
import FormItem from '@/components/formItem';
import {
  AutoHeightOne,
  AutoLineHeight,
  BackgroundColor,
  Delete,
  ExpandLeftAndRight,
  FontSize,
  SlidingVertical,
} from '@icon-park/react';
import GridLayout from 'react-grid-layout';
import { moduleType } from '@/modules/utils/constant';

function Global() {
  const global = configStore.getConfig?.globalStyle;
  const [form] = Form.useForm();

  const { run: handleChange } = useDebounceFn(
    (value: number, key: string) => {
      global[key] = value;
      configStore.setConfig({
        ...configStore.getConfig,
        globalStyle: global,
      });
    },
    { wait: 100 }
  );

  const [moduleLayout, setModuleLayout] = useState<Array<any>>([]);

  useEffect(() => {
    const config = configStore.getConfig;
    if (!config) {
      return;
    }

    const layout: Array<any> = [];
    let i = 0;
    for (const page of config.pages) {
      for (const module of page.modules) {
        layout.push({
          name: (moduleType as any)[module.type].name,
          id: module.id,
          x: 0,
          y: i++,
          w: 1,
          h: 1,
        });
      }
    }
    setModuleLayout(layout);
  }, [configStore.getConfig]);

  const confirmDelete = (index: number) => {
    const config = configStore.getConfig;
    if (!config) return;
    let idx = 0;
    for (const page of config.pages) {
      for (const _ of page.modules) {
        if (idx === index) {
          page.modules.splice(idx, 1);
          configStore.setConfig({
            ...config,
            pages: [...config.pages],
          });
          return;
        }
        idx++;
      }
    }
  };

  const findModule = useMemoizedFn((id: string) => {
    const config = configStore.getConfig;
    if (!config) return;
    for (const page of config.pages) {
      for (const module of page.modules) {
        if (module.id == id) {
          return module;
        }
      }
    }
    return null;
  });

  const moduleLayoutChange = useMemoizedFn(
    (newModuleLayout: Array<{ name: string; id: string }>) => {
      setModuleLayout(newModuleLayout);
      const config = configStore.getConfig;
      if (!config) return;
      const modules = [];
      for (const item of newModuleLayout) {
        modules.push(findModule(item.id));
      }
      configStore.setConfig({
        ...config,
        pages: [
          {
            ...(config.pages[0] ?? { moduleMargin: 15 }),
            modules,
          },
        ],
      });
    }
  );

  return (
    <div className={styles.globalPanel}>
      {global && (
        <Form form={form} variant='filled' layout='vertical'>
          <Title title='全局样式' />
          <Row gutter={15}>
            <Col span={12}>
              <FormItem
                label='字体大小'
                icon={<FontSize theme='outline' size='15' fill='#333' />}
              >
                <InputNumber
                  value={global.fontSize}
                  style={{ width: '100%' }}
                  min={1}
                  max={100}
                  addonAfter='PX'
                  onChange={(value) => handleChange(value, 'fontSize')}
                />
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem
                label='行高'
                icon={<AutoLineHeight theme='outline' size='15' fill='#333' />}
              >
                <InputNumber
                  value={global.lineHeight}
                  style={{ width: '100%' }}
                  min={1}
                  max={100}
                  step={0.1}
                  precision={1}
                  addonAfter='倍'
                  onChange={(value) => handleChange(value, 'lineHeight')}
                />
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem
                label='左右间距'
                icon={
                  <ExpandLeftAndRight theme='outline' size='15' fill='#333' />
                }
              >
                <InputNumber
                  value={global.horizontalMargin}
                  style={{ width: '100%' }}
                  min={1}
                  addonAfter='PX'
                  onChange={(value) => handleChange(value, 'horizontalMargin')}
                />
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem
                label='上下间距'
                icon={<AutoHeightOne theme='outline' size='15' fill='#333' />}
              >
                <InputNumber
                  value={global.verticalMargin}
                  style={{ width: '100%' }}
                  min={1}
                  addonAfter='PX'
                  onChange={(value) => handleChange(value, 'verticalMargin')}
                />
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem
                label='背景颜色'
                icon={<BackgroundColor theme='outline' size='15' fill='#333' />}
              >
                <ColorPicker
                  defaultValue={global.backgroundColor}
                  onChange={(_, rgba) => handleChange(rgba, 'backgroundColor')}
                />
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem
                label='主题颜色'
                icon={<BackgroundColor theme='outline' size='15' fill='#333' />}
              >
                <ColorPicker
                  defaultValue={global.color}
                  onChange={(_, rgba) => handleChange(rgba, 'color')}
                />
              </FormItem>
            </Col>
          </Row>
          {/* Glassmorphism 风格模块排列说明 */}
          <Title title='模块排列' />
          <div className='w-full bg-gray-100 rounded-lg p-[5px] overflow-y-auto max-h-[400px]'>
            <GridLayout
              className=''
              layout={moduleLayout}
              cols={1}
              rowHeight={40}
              margin={[10, 10]}
              width={450}
              isResizable={false}
              compactType='vertical'
              draggableHandle='.drag-handle'
              onDragStop={(layout: any) => {
                const newModuleLayout = layout
                  .sort((a: any, b: any) => a.y - b.y)
                  .map((item: any) =>
                    moduleLayout.find((m: any) => m.y == item.i)
                  )
                  .filter(Boolean);
                moduleLayoutChange(newModuleLayout);
              }}
            >
              {moduleLayout
                ? moduleLayout.map((item: any, index: number) => (
                    <div
                      key={item.y}
                      className={`${styles.moduleItem} w-full rounded-lg flex items-center justify-center text-white font-bold relative hover:bg-blue-400 transition-all`}
                    >
                      <SlidingVertical
                        className='drag-handle absolute top-1/2 left-[15px] translate-y-[-50%] cursor-move'
                        theme='outline'
                        size='20'
                        fill='#1677ff'
                      />
                      {item.name}
                      <Popconfirm
                        title='提示'
                        placement='top'
                        description='确定要删除吗？'
                        okText='确定'
                        cancelText='取消'
                        overlayStyle={{ width: '200px' }}
                        onConfirm={() => confirmDelete(index)}
                      >
                        <div className='absolute top-1/2 right-[15px] translate-y-[-50%] cursor-pointer'>
                          <Delete theme='outline' size='18' fill='#1677ff' />
                        </div>
                      </Popconfirm>
                    </div>
                  ))
                : null}
            </GridLayout>
          </div>
        </Form>
      )}
    </div>
  );
}

export default memo(observer(Global));
