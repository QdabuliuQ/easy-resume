import FormItem from '@/components/formItem';
import { useModuleHandle } from '@/hooks/module';
import { configStore, moduleActiveStore } from '@/mobx';
import { city } from '@/modules/utils/constant';
import {
  Add,
  Briefcase,
  BuildingThree,
  Calendar,
  Delete,
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
import { memo } from 'react';
import styles from './index.module.less';
import dayjs from 'dayjs';
import { useDebounceFn, useMemoizedFn } from 'ahooks';

function Job() {
  const { getModule } = useModuleHandle();

  const moduleActive = moduleActiveStore.getModuleActive;
  let module = JSON.parse(JSON.stringify(getModule(moduleActive)));

  module.options.items = module.options.items.map((item: any) => ({
    ...item,
    city: item.city.split(' - '),
  }));

  const { run: handleChange } = useDebounceFn(
    (e: any, index: number, key: string) => {
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

      configStore.setConfig({
        ...config,
        pages: [...config.pages],
      });
    }
  );

  const handleDelete = useMemoizedFn((index: number) => {
    const config = configStore.getConfig;
    if (!config) return;
    const module = getModule(moduleActive);
    if (!module) return;
    module.options.items.splice(index, 1);
  });

  const handleAdd = useMemoizedFn(() => {
    const config = configStore.getConfig;
    if (!config) return;
    const module = getModule(moduleActive);
    if (!module) return;
    module.options.items.push({
      company: '',
      post: '',
      department: '',
      city: '',
      startDate: undefined,
      endDate: undefined,
      description: '',
    });
  });

  return (
    <div className={styles.job}>
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
                      key={module.options.items.length}
                      defaultValue={item.company}
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
                      key={module.options.items.length}
                      defaultValue={item.post}
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
                      key={module.options.items.length}
                      defaultValue={item.department}
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
                      key={module.options.items.length}
                      defaultValue={item.city}
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
                      key={module.options.items.length}
                      style={{ width: '100%' }}
                      defaultValue={[
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
                      key={module.options.items.length}
                      defaultValue={item.description}
                      placeholder='请输入工作内容'
                      autoSize={{ minRows: 7 }}
                      onChange={(e) => handleChange(e, index, 'description')}
                    />
                  </FormItem>
                </Col>
              </Row>
            </Form>
            <Button
              color='danger'
              variant='solid'
              icon={<Delete theme='outline' size='15' fill='#fff' />}
              onClick={() => handleDelete(index)}
            >
              删除
            </Button>
            {index !== module?.options.items.length - 1 && (
              <div className='w-full h-[1px] bg-[#e5e5e5] mt-[10px]'></div>
            )}
          </div>
        ))
      ) : (
        <Empty description='暂无数据' className='mb-5' />
      )}
      <Button
        color='primary'
        variant='solid'
        block
        icon={<Add theme='outline' size='15' fill='#fff' />}
        onClick={handleAdd}
      >
        添加工作经历
      </Button>
    </div>
  );
}

export default memo(observer(Job));
