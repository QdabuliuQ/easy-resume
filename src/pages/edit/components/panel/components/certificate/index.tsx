import FormItem from '@/components/formItem';
import { configStore, moduleActiveStore } from '@/mobx';
import { Button, Col, DatePicker, Empty, Form, Input, Row } from 'antd';
import dayjs from 'dayjs';
import { observer } from 'mobx-react';
import { memo, useMemo } from 'react';
import {
  Add,
  Calendar,
  Certificate as CertificateIcon,
  Delete,
} from '@icon-park/react';
import styles from './index.module.less';
import { useDebounceFn, useMemoizedFn } from 'ahooks';
import { useModuleHandle } from '@/hooks/module';

function Certificate() {
  const { getModule } = useModuleHandle();

  const moduleActive = moduleActiveStore.getModuleActive;
  const module = getModule(moduleActive);

  const addCertificate = useMemoizedFn(() => {
    const config = configStore.getConfig;
    if (!config) return;
    const module = getModule(moduleActive);
    if (!module) return;
    module.options.items.unshift({
      name: '证书',
      date: '2020-01-01',
    });
    configStore.setConfig({
      ...config,
      pages: [...config.pages],
    });
  });

  const { run: handleChange } = useDebounceFn(
    (index: number, key: string, value: any) => {
      const config = configStore.getConfig;
      if (!config) return;
      const module = getModule(moduleActive);
      if (!module) return;
      if (key === 'name') {
        module.options.items[index][key] = value.target.value;
      } else if (key === 'date') {
        module.options.items[index][key] = value.format('YYYY-MM-DD');
      }
      configStore.setConfig({
        ...config,
        pages: [...config.pages],
      });
    },
    { wait: 100 }
  );

  const handleDelete = useMemoizedFn((index: number) => {
    const config = configStore.getConfig;
    if (!config) return;
    const module = getModule(moduleActive);
    if (!module) return;
    module.options.items.splice(index, 1);
    configStore.setConfig({
      ...config,
      pages: [...config.pages],
    });
  });

  return (
    <div className={styles.certificate}>
      {module && module.options.items.length > 0 ? (
        <div className='flex flex-col justify-flex-end items-end mb-5'>
          {module.options.items.map((item: any, index: number) => (
            <div
              key={index}
              className='w-full flex flex-col justify-flex-end items-end not-last:mb-5'
            >
              <Form layout='vertical' className='w-full'>
                <Row gutter={15}>
                  <Col span={12}>
                    <FormItem
                      label='证书名称'
                      icon={
                        <CertificateIcon
                          theme='outline'
                          size='15'
                          fill='#333'
                        />
                      }
                    >
                      <Input
                        key={module.options.items.length}
                        defaultValue={item.name}
                        placeholder='请输入证书名称'
                        onChange={(e) => handleChange(index, 'name', e)}
                      />
                    </FormItem>
                  </Col>
                  <Col span={12}>
                    <FormItem
                      label='获取日期'
                      icon={<Calendar theme='outline' size='15' fill='#333' />}
                    >
                      <DatePicker
                        key={module.options.items.length}
                        style={{ width: '100%' }}
                        defaultValue={dayjs(item.date)}
                        placeholder='请选择获取日期'
                        onChange={(e) => handleChange(index, 'date', e)}
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
              {index !== module.options.items.length - 1 && (
                <div className='w-full h-[1px] bg-[#e5e5e5] mt-[10px]'></div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Empty description='暂无数据' className='mb-5' />
      )}
      <Button
        color='primary'
        variant='solid'
        block
        icon={<Add theme='outline' size='15' fill='#fff' />}
        onClick={addCertificate}
      >
        添加证书
      </Button>
    </div>
  );
}

export default memo(observer(Certificate));
