import { memo, useEffect, useMemo, useState } from 'react';

import { configStore } from '@/mobx';
import { observer } from 'mobx-react';
import { Col, ColorPicker, Form, InputNumber, Row } from 'antd';
import styles from './index.module.less';
import { useDebounceFn } from 'ahooks';
import Title from '@/components/title';
import FormItem from '@/components/formItem';
import {
  AutoHeightOne,
  AutoLineHeight,
  BackgroundColor,
  ExpandLeftAndRight,
  FontSize,
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
          i: (moduleType as any)[module.type].name,
          x: 0,
          y: i++,
          w: 1,
          h: 1,
        });
      }
    }
    setModuleLayout(layout);
  }, [configStore.getConfig]);

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
          </Row>
          <Title title='模块排列' />
          {/* 用 react-grid-layout 实现竖向排列 */}
          <div className='w-full bg-gray-100 rounded-lg p-[10px]'>
            <GridLayout
              className=''
              layout={moduleLayout}
              cols={1}
              rowHeight={40}
              margin={[10, 10]}
              width={440}
              isResizable={false}
              compactType='vertical'
              onDragStop={(layout: any) => {
                // 竖向排列时，layout 已经是按 y 排序
                // 只需将 key 按 y 排序后存储
                const newLayout = layout
                  .sort((a: any, b: any) => a.y - b.y)
                  .map((item: any) => [item.i]);
                handleChange(newLayout, 'layout');
              }}
            >
              {moduleLayout
                ? moduleLayout.map((item: any) => (
                    <div
                      key={item.y}
                      className='w-full bg-blue-300 cursor-move rounded-lg flex items-center justify-center text-white font-bold'
                      style={{
                        transition: 'box-shadow 0.2s',
                      }}
                    >
                      {item.i}
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
