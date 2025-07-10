import FormItem from '@/components/formItem';
import { useModuleHandle } from '@/hooks/module';
import { configStore, moduleActiveStore } from '@/mobx';
import { ProjectProps } from '@/modules/project';
import { Add, Book, Avatar, Calendar, EditOne } from '@icon-park/react';
import { useDebounceFn, useMemoizedFn, useMount } from 'ahooks';
import { Button, Col, DatePicker, Empty, Form, Input, Row, Spin } from 'antd';
import dayjs from 'dayjs';
import { observer } from 'mobx-react';
import { memo, useState } from 'react';
import styles from './index.module.less';
import ButtonGroup from '../buttonGroup';
import SplitLine from '../splitLine';

function Project() {
  const { getModule, getModuleIndex } = useModuleHandle();

  const moduleActive = moduleActiveStore.getModuleActive;

  const [module, setModule] = useState<ProjectProps | null>(null);

  useMount(() => {
    const _module = JSON.parse(JSON.stringify(getModule(moduleActive)));
    setModule(_module);
  });

  const { run } = useDebounceFn(
    (module: ProjectProps) => {
      const config = configStore.getConfig;
      if (!config) return;
      const res = getModuleIndex(moduleActive);
      if (!res) return;
      const _module = JSON.parse(JSON.stringify(module));
      config.pages[res.page].modules[res.module] = _module;
      configStore.setConfig({
        ...config,
        pages: [...config.pages],
      });
    },
    { wait: 100 }
  );

  const handleAdd = useMemoizedFn(() => {
    if (!module) return;
    module.options.items.unshift({
      name: '',
      role: '',
      startDate: undefined as any,
      endDate: undefined as any,
      description: '',
    });
    updateModule(module);
  });

  const updateModule = useMemoizedFn((module: ProjectProps) => {
    const _module = JSON.parse(JSON.stringify(module));
    setModule(_module);
    run(_module);
  });

  const handleUp = useMemoizedFn((index: number) => {
    if (!module) return;
    const item = module.options.items[index];
    module.options.items[index] = module.options.items[index - 1];
    module.options.items[index - 1] = item;
    updateModule(module);
  });

  const handleDown = useMemoizedFn((index: number) => {
    if (!module) return;
    const item = module.options.items[index];
    module.options.items[index] = module.options.items[index + 1];
    module.options.items[index + 1] = item;
    updateModule(module);
  });

  const handleDelete = useMemoizedFn((index: number) => {
    if (!module) return;
    module.options.items.splice(index, 1);
    updateModule(module);
  });

  const handleCopy = useMemoizedFn((index: number) => {
    if (!module) return;
    module.options.items.splice(
      index,
      0,
      JSON.parse(JSON.stringify(module.options.items[index]))
    );
    updateModule(module);
  });

  const handleChange = useMemoizedFn((e: any, index: number, key: string) => {
    if (!module) return;
    if (key === 'name' || key === 'role' || key === 'description') {
      module.options.items[index][key] = e.target.value;
    } else if (key === 'date') {
      module.options.items[index].startDate = e[0].format('YYYY-MM');
      module.options.items[index].endDate = e[1].format('YYYY-MM');
    }
    updateModule(module);
  });

  return (
    <div className={styles.project}>
      <Button
        type='primary'
        block
        icon={<Add theme='outline' size='15' fill='#fff' />}
        className='mb-[20px] h-[40px]!'
        onClick={handleAdd}
      >
        添加项目经历
      </Button>
      {module && module.options.items.length ? (
        module?.options.items.map((item: any, index: number) => (
          <div
            key={index}
            className='mb-[10px] flex flex-col items-end justify-end'
          >
            <Form layout='vertical' className='w-full'>
              <Row gutter={15}>
                <Col span={12}>
                  <FormItem
                    label='项目名称'
                    icon={<Book theme='outline' size='15' fill='#333' />}
                  >
                    <Input
                      value={item.name}
                      placeholder='请输入项目名称'
                      onChange={(e) => handleChange(e, index, 'name')}
                    />
                  </FormItem>
                </Col>
                <Col span={12}>
                  <FormItem
                    label='担任角色'
                    icon={<Avatar theme='outline' size='15' fill='#333' />}
                  >
                    <Input
                      value={item.role}
                      placeholder='请输入担任角色'
                      onChange={(e) => handleChange(e, index, 'role')}
                    />
                  </FormItem>
                </Col>
                <Col span={24}>
                  <FormItem
                    label='项目时间'
                    icon={<Calendar theme='outline' size='15' fill='#333' />}
                  >
                    <DatePicker.RangePicker
                      style={{ width: '100%' }}
                      value={[
                        item.startDate ? dayjs(item.startDate) : undefined,
                        item.endDate ? dayjs(item.endDate) : undefined,
                      ]}
                      format='YYYY-MM'
                      placeholder={['开始时间', '结束时间']}
                      onChange={(e) => handleChange(e, index, 'date')}
                    />
                  </FormItem>
                </Col>
                <Col span={24}>
                  <FormItem
                    label='项目描述'
                    icon={<EditOne theme='outline' size='15' fill='#333' />}
                  >
                    <Input.TextArea
                      value={item.description}
                      autoSize={{ minRows: 7 }}
                      placeholder='请输入项目描述'
                      onChange={(e) => handleChange(e, index, 'description')}
                    />
                  </FormItem>
                </Col>
              </Row>
            </Form>
            <ButtonGroup
              showUp={index !== 0}
              showDown={index !== module?.options.items.length - 1}
              handleUp={() => handleUp(index)}
              handleDown={() => handleDown(index)}
              handleDelete={() => handleDelete(index)}
              handleCopy={() => handleCopy(index)}
            />
            {index !== module?.options.items.length - 1 && <SplitLine />}
          </div>
        ))
      ) : (
        <Empty description='暂无项目经历' />
      )}
    </div>
  );
}

export default memo(observer(Project));
