import FormItem from '@/components/formItem';
import { useModuleHandle } from '@/hooks/module';
import { configStore, moduleActiveStore } from '@/mobx';
import { city } from '@/modules/utils/constant';
import {
  Add,
  Briefcase,
  BuildingThree,
  Calendar,
  HomeTwo,
  Notes,
  PullDoor,
} from '@icon-park/react';
import {
  Row,
  Col,
  Input,
  Form,
  Cascader,
  Button,
  DatePicker,
  Empty,
} from 'antd';
import { observer } from 'mobx-react';
import { memo, useState } from 'react';
import styles from './index.module.less';
import dayjs from 'dayjs';
import { useDebounceFn, useMemoizedFn, useMount } from 'ahooks';
import ButtonGroup from '../buttonGroup';
import { JobProps } from '@/modules/job';

function Job() {
  const { getModule, getModuleIndex } = useModuleHandle();

  const moduleActive = moduleActiveStore.getModuleActive;

  const [module, setModule] = useState<JobProps | null>(null);

  useMount(() => {
    const _module = JSON.parse(JSON.stringify(getModule(moduleActive)));
    _module.options.items = _module.options.items.map((item: any) => ({
      ...item,
      city: item.city.split(' - '),
    }));
    setModule(_module);
  });

  const { run } = useDebounceFn(
    (module: JobProps) => {
      const config = configStore.getConfig;
      if (!config) return;
      const res = getModuleIndex(moduleActive);
      if (!res) return;
      const _module = JSON.parse(JSON.stringify(module));
      _module.options.items = _module.options.items.map((item: any) => ({
        ...item,
        city: item.city.join(' - '),
      }));
      config.pages[res.page].modules[res.module] = _module;
      configStore.setConfig({
        ...config,
        pages: [...config.pages],
      });
    },
    { wait: 100 }
  );

  const updateModule = useMemoizedFn((module: JobProps) => {
    const _module = JSON.parse(JSON.stringify(module));
    setModule(_module);
    run(_module);
  });

  const handleChange = useMemoizedFn((e: any, index: number, key: string) => {
    const config = configStore.getConfig;
    if (!config) return;
    const module = getModule(moduleActive);
    if (!module) return;
    if (
      key === 'company' ||
      key === 'post' ||
      key === 'department' ||
      key === 'description'
    ) {
      module.options.items[index][key] = e.target.value;
    } else if (key === 'city') {
      module.options.items[index][key] = e.join(' - ');
    } else if (key === 'date') {
      module.options.items[index].startDate = e[0].format('YYYY-MM-DD');
      module.options.items[index].endDate = e[1].format('YYYY-MM-DD');
    }
    updateModule(module);
  });

  const handleDelete = useMemoizedFn((index: number) => {
    if (!module) return;
    module.options.items.splice(index, 1);
    updateModule(module);
  });

  const handleAdd = useMemoizedFn(() => {
    if (!module) return;
    module.options.items.unshift({
      company: '',
      post: '',
      department: '',
      city: '',
      startDate: undefined as any,
      endDate: undefined as any,
      description: '',
    });
    updateModule(module);
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

  const handleCopy = useMemoizedFn((index: number) => {
    if (!module) return;
    module.options.items.splice(
      index,
      0,
      JSON.parse(JSON.stringify(module.options.items[index]))
    );
    updateModule(module);
  });

  return (
    <div className={styles.job}>
      <Button
        className='mb-[20px] h-[40px]!'
        color='primary'
        variant='solid'
        block
        icon={<Add theme='outline' size='15' fill='#fff' />}
        onClick={handleAdd}
      >
        添加工作经历
      </Button>
      {module && module.options.items.length ? (
        module?.options.items.map((item: any, index: number) => (
          <div
            key={index}
            className='mb-[10px] flex flex-col items-end justify-end'
          >
            <Form layout='vertical'>
              <Row gutter={15}>
                <Col span={12}>
                  <FormItem
                    label='公司'
                    icon={
                      <BuildingThree theme='outline' size='15' fill='#333' />
                    }
                  >
                    <Input
                      value={item.company}
                      placeholder='请输入公司'
                      onChange={(e) => handleChange(e, index, 'company')}
                    />
                  </FormItem>
                </Col>
                <Col span={12}>
                  <FormItem
                    label='职位'
                    icon={<Briefcase theme='outline' size='15' fill='#333' />}
                  >
                    <Input
                      value={item.post}
                      placeholder='请输入职位'
                      onChange={(e) => handleChange(e, index, 'post')}
                    />
                  </FormItem>
                </Col>
                <Col span={12}>
                  <FormItem
                    label='部门'
                    icon={<PullDoor theme='outline' size='15' fill='#333' />}
                  >
                    <Input
                      value={item.department}
                      placeholder='请输入部门'
                      onChange={(e) => handleChange(e, index, 'department')}
                    />
                  </FormItem>
                </Col>
                <Col span={12}>
                  <FormItem
                    label='城市'
                    icon={<HomeTwo theme='outline' size='15' fill='#333' />}
                  >
                    <Cascader
                      value={item.city}
                      options={city}
                      placeholder='请选择城市'
                      onChange={(e) => handleChange(e, index, 'city')}
                    />
                  </FormItem>
                </Col>
                <Col span={24}>
                  <FormItem
                    label='在职时间'
                    icon={<Calendar theme='outline' size='15' fill='#333' />}
                  >
                    <DatePicker.RangePicker
                      style={{ width: '100%' }}
                      value={[
                        item.startDate ? dayjs(item.startDate) : undefined,
                        item.endDate ? dayjs(item.endDate) : undefined,
                      ]}
                      placeholder={['开始时间', '结束时间']}
                      onChange={(e) => handleChange(e, index, 'date')}
                    />
                  </FormItem>
                </Col>
                <Col span={24}>
                  <FormItem
                    label='工作内容'
                    icon={<Notes theme='outline' size='15' fill='#333' />}
                  >
                    <Input.TextArea
                      value={item.description}
                      placeholder='请输入工作内容'
                      autoSize={{ minRows: 7 }}
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
            {index !== module?.options.items.length - 1 && (
              <div className='w-full h-[1px] bg-[#e5e5e5] mt-[10px]'></div>
            )}
          </div>
        ))
      ) : (
        <Empty description='暂无数据' className='mb-5' />
      )}
    </div>
  );
}

export default memo(observer(Job));
