import FormItem from '@/components/formItem';
import { configStore, moduleActiveStore } from '@/mobx';
import { Button, Col, DatePicker, Empty, Form, Input, Row } from 'antd';
import dayjs from 'dayjs';
import { observer } from 'mobx-react';
import { memo, useState } from 'react';
import {
  Add,
  Calendar,
  Certificate as CertificateIcon,
} from '@icon-park/react';
import styles from './index.module.less';
import { useDebounceFn, useMemoizedFn, useMount } from 'ahooks';
import { useModuleHandle } from '@/hooks/module';
import ButtonGroup from '../buttonGroup';
import { CertificateProps } from '@/modules/certificate';

function Certificate() {
  const { getModule, getModuleIndex } = useModuleHandle();

  const moduleActive = moduleActiveStore.getModuleActive;
  const [module, setModule] = useState<CertificateProps | null>(null);

  useMount(() => {
    const _module = JSON.parse(JSON.stringify(getModule(moduleActive)));
    setModule(_module);
  });

  const { run } = useDebounceFn(
    (module: CertificateProps) => {
      const config = configStore.getConfig;
      if (!config) return;
      const res = getModuleIndex(moduleActive);
      if (!res) return;
      config.pages[res.page].modules[res.module] = module;
      configStore.setConfig({
        ...config,
        pages: [...config.pages],
      });
    },
    { wait: 100 }
  );

  const updateModule = useMemoizedFn((module: CertificateProps) => {
    const _module = JSON.parse(JSON.stringify(module));
    setModule(_module);
    run(_module);
  });
  const addCertificate = useMemoizedFn(() => {
    if (!module) return;
    module.options.items.unshift({
      name: '证书',
      date: '2020-01-01',
    });
    updateModule(module);
  });

  const handleChange = useMemoizedFn(
    (index: number, key: string, value: any) => {
      if (!module) return;
      if (key === 'name') {
        module.options.items[index][key] = value.target.value;
      } else if (key === 'date') {
        module.options.items[index][key] = value.format('YYYY-MM-DD');
      }
      updateModule(module);
    }
  );

  const handleDelete = useMemoizedFn((index: number) => {
    if (!module) return;
    module.options.items.splice(index, 1);
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
    <div className={styles.certificate}>
      <Button
        className='mb-[20px] h-[40px]!'
        color='primary'
        variant='solid'
        block
        icon={<Add theme='outline' size='15' fill='#fff' />}
        onClick={addCertificate}
      >
        添加证书
      </Button>
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
                        value={item.name}
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
                        style={{ width: '100%' }}
                        value={dayjs(item.date)}
                        placeholder='请选择获取日期'
                        onChange={(e) => handleChange(index, 'date', e)}
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
              {index !== module.options.items.length - 1 && (
                <div className='w-full h-[1px] bg-[#e5e5e5] mt-[10px]'></div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Empty description='暂无数据' className='mb-5' />
      )}
    </div>
  );
}

export default memo(observer(Certificate));
