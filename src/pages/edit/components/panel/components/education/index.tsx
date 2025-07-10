import FormItem from '@/components/formItem';
import { useModuleHandle } from '@/hooks/module';
import { configStore, moduleActiveStore } from '@/mobx';
import { ProjectProps } from '@/modules/project';
import {
  Add,
  Calendar,
  EditOne,
  DegreeHat,
  School,
  Bookmark,
  City,
  Notes,
  BuildingFour,
} from '@icon-park/react';
import { useDebounceFn, useMemoizedFn, useMount } from 'ahooks';
import {
  Button,
  Cascader,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  Row,
  Select,
} from 'antd';
import dayjs from 'dayjs';
import { observer } from 'mobx-react';
import { memo, useState } from 'react';
import ButtonGroup from '../buttonGroup';
import { city, degree, schoolType } from '@/modules/utils/constant';
import { EducationProps } from '@/modules/education';
import styles from './index.module.less';
import SplitLine from '../splitLine';

function Education() {
  const { getModule, getModuleIndex } = useModuleHandle();

  const moduleActive = moduleActiveStore.getModuleActive;

  const [module, setModule] = useState<EducationProps | null>(null);

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
      school: '',
      degree: undefined as any,
      major: '',
      city: '',
      tags: [],
      academy: '',
      startDate: undefined as any,
      endDate: undefined as any,
      description: '',
    });
    updateModule(module);
  });

  const updateModule = useMemoizedFn((module: EducationProps) => {
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
    if (
      key === 'school' ||
      key === 'major' ||
      key === 'academy' ||
      key === 'description'
    ) {
      module.options.items[index][key] = e.target.value;
    } else if (key === 'degree' || key === 'tags') {
      console.log(e);
      module.options.items[index][key] = e;
    } else if (key === 'date') {
      module.options.items[index].startDate = e[0].format('YYYY-MM');
      module.options.items[index].endDate = e[1].format('YYYY-MM');
    } else if (key === 'city') {
      module.options.items[index][key] = e.join(' - ');
    }
    updateModule(module);
  });

  return (
    <div className={styles.education}>
      <Button
        type='primary'
        block
        icon={<Add theme='outline' size='15' fill='#fff' />}
        className='mb-[20px] h-[40px]!'
        onClick={handleAdd}
      >
        添加教育经历
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
                    label='学校名称'
                    icon={<School theme='outline' size='15' fill='#333' />}
                  >
                    <Input
                      value={item.school}
                      placeholder='请输入学校名称'
                      onChange={(e) => handleChange(e, index, 'school')}
                    />
                  </FormItem>
                </Col>
                <Col span={12}>
                  <FormItem
                    label='学位'
                    icon={<DegreeHat theme='outline' size='15' fill='#333' />}
                  >
                    <Select
                      options={degree}
                      value={item.degree}
                      onChange={(e) => handleChange(e, index, 'degree')}
                      placeholder='请选择学位'
                    />
                  </FormItem>
                </Col>
                <Col span={12}>
                  <FormItem
                    label='专业'
                    icon={<Bookmark theme='outline' size='15' fill='#333' />}
                  >
                    <Input
                      value={item.major}
                      placeholder='请输入专业'
                      onChange={(e) => handleChange(e, index, 'major')}
                    />
                  </FormItem>
                </Col>
                <Col span={12}>
                  <FormItem
                    label='所在城市'
                    icon={<City theme='outline' size='15' fill='#333' />}
                  >
                    <Cascader
                      options={city}
                      value={item.city}
                      onChange={(e) => handleChange(e, index, 'city')}
                      placeholder='请选择城市'
                    />
                  </FormItem>
                </Col>
                <Col span={24}>
                  <FormItem
                    label='学校类型'
                    icon={<Notes theme='outline' size='15' fill='#333' />}
                  >
                    <Select
                      options={schoolType}
                      value={item.tags}
                      onChange={(e) => handleChange(e, index, 'tags')}
                      placeholder='请选择学校类型'
                      mode='multiple'
                    />
                  </FormItem>
                </Col>
                <Col span={24}>
                  <FormItem
                    label='学院'
                    icon={
                      <BuildingFour theme='outline' size='15' fill='#333' />
                    }
                  >
                    <Input
                      value={item.academy}
                      placeholder='请输入学院'
                      onChange={(e) => handleChange(e, index, 'academy')}
                    />
                  </FormItem>
                </Col>
                <Col span={24}>
                  <FormItem
                    label='在读时间'
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
                    label='在校经历'
                    icon={<EditOne theme='outline' size='15' fill='#333' />}
                  >
                    <Input.TextArea
                      value={item.description}
                      autoSize={{ minRows: 7 }}
                      placeholder='请输入在校经历'
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
        <Empty description='暂无教育经历' />
      )}
    </div>
  );
}

export default memo(observer(Education));
