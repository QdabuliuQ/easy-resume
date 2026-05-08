import { memo, useEffect, useState } from 'react';

import { configStore, moduleActiveStore } from '@/mobx';
import { observer } from 'mobx-react';
import { Col, ColorPicker, Form, InputNumber, Modal, Row, Select } from 'antd';
import { useDebounceFn, useMemoizedFn } from 'ahooks';
import Title from '@/components/title';
import FormItem from '@/components/formItem';
import {
  AutoLineHeight,
  BackgroundColor,
  Delete,
  Edit,
  FontSize,
  Notes,
  SlidingVertical,
} from '@icon-park/react';
import GridLayout from 'react-grid-layout';
import { moduleType } from '@/modules/utils/constant';
import { RESUME_PAGE_SIZE_OPTIONS } from '@/lib/resumePageSize';

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
      const modules: NonNullable<ReturnType<typeof findModule>>[] = [];
      for (const item of newModuleLayout) {
        const m = findModule(item.id);
        if (m) modules.push(m);
      }
      configStore.setConfig({
        ...config,
        pages: [
          {
            modules,
          },
        ],
      });
    }
  );

  const editModule = useMemoizedFn((item: any) => {
    moduleActiveStore.setModuleActive(item.id);
  });

  return (
    <div className='[&_.ant-color-picker-trigger]:!w-full [&_.ant-color-picker-trigger_.ant-color-picker-clear]:!w-full [&_.ant-color-picker-trigger_.ant-color-picker-clear::after]:!w-full [&_.ant-color-picker-trigger_.ant-color-picker-clear::after]:rotate-[354deg] [&_.ant-color-picker-trigger_.ant-color-picker-color-block]:!w-full [&_.react-grid-placeholder]:!bg-transparent'>
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
            <Col span={24}>
              <FormItem label='纸张大小' icon={<Notes theme='outline' size='15' fill='#333' />}>
                <Select
                  value={global.pageSize ?? 'A4'}
                  style={{ width: '100%' }}
                  options={RESUME_PAGE_SIZE_OPTIONS}
                  onChange={(v) => {
                    global.pageSize = v;
                    configStore.setConfig({
                      ...configStore.getConfig,
                      globalStyle: global,
                    });
                  }}
                />
              </FormItem>
            </Col>
            <Col span={24}>
              <FormItem
                label='模块标题样式'
                icon={<Edit theme='outline' size='15' fill='#333' />}
              >
                <Select
                  value={global.headerType ?? 1}
                  style={{ width: '100%' }}
                  options={[
                    { value: 1, label: '样式1 · 左侧竖条 + 浅底' },
                    { value: 2, label: '样式2 · 居中标题 + 通栏横线' },
                    { value: 3, label: '样式3 · 斜切色块 + 装饰 + 横线' },
                    { value: 4, label: '样式4 · 左对齐 + 底部分割线' },
                    { value: 5, label: '样式5 · 箭头色带' },
                    { value: 6, label: '样式6 · 双三角 + 横线延伸' },
                    { value: 7, label: '样式7 · 左栏标题 + 竖线 + 右侧内容区' },
                    { value: 8, label: '样式8 · 图标 + 文本标题' },
                  ]}
                  onChange={(v) => {
                    global.headerType = v;
                    configStore.setConfig({
                      ...configStore.getConfig,
                      globalStyle: global,
                    });
                  }}
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
                ? moduleLayout.map((item: any, index: number) => {
                    const openDeleteConfirm = () => {
                      Modal.confirm({
                        title: '提示',
                        content: '确定要删除吗？',
                        okText: '确定',
                        cancelText: '取消',
                        okButtonProps: { danger: true },
                        centered: true,
                        onOk: () => confirmDelete(index),
                      });
                    };
                    return (
                    <div
                      key={item.y}
                      className='relative box-border flex w-full items-center justify-center rounded-lg border-2 border-dashed border-[#1677ff] bg-white font-bold text-[#1677ff] transition-colors duration-100 ease-linear hover:!bg-[#2383ff] hover:!text-white hover:[&_path]:!stroke-white hover:[&_span_svg_path]:!stroke-white'
                    >
                      <SlidingVertical
                        className='drag-handle absolute top-1/2 left-[15px] translate-y-[-50%] cursor-move'
                        theme='outline'
                        size='20'
                        fill='#1677ff'
                      />
                      {item.name}
                      <div
                        role='button'
                        tabIndex={0}
                        className='absolute top-1/2 right-[15px] translate-y-[-50%] cursor-pointer'
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteConfirm();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            openDeleteConfirm();
                          }
                        }}
                      >
                        <Delete theme='outline' size='17' fill='#1677ff' />
                      </div>
                      <Edit
                        className='absolute top-1/2 right-[42px] translate-y-[-50%] cursor-pointer'
                        theme='outline'
                        size='18'
                        fill='#1677ff'
                        onClick={() => editModule(item)}
                      />
                    </div>
                    );
                  })
                : null}
            </GridLayout>
          </div>
        </Form>
      )}
    </div>
  );
}

export default memo(observer(Global));
