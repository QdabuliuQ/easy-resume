import { observer } from 'mobx-react';
import { memo, useMemo, useRef } from 'react';
import styles from './index.module.less';
import {
  Cascader,
  Col,
  DatePicker,
  Form,
  Input,
  message,
  Row,
  Select,
  Upload,
} from 'antd';
import {
  gender,
  origin,
  politicalStatus,
  maritalStatus,
  city,
  intentCity,
  status,
  ethnic,
  info,
} from '@/modules/utils/constant';
import { useMemoizedFn } from 'ahooks';
import CropperImage from '@/components/cropperImage';
import { fileToBase64 } from '@/utils';
import { configStore, moduleActiveStore } from '@/mobx';
import dayjs from 'dayjs';
import InfoLayout from '@/components/infoLayout';
import Title from '@/components/title';
import { update, useRender } from '@/hooks/render';

function Info1() {
  const [form] = Form.useForm();
  const { render } = useRender();
  const cropperRef = useRef<any>(null);
  const uploadButton = useMemo(
    () => (
      <button
        style={{ border: 0, background: 'none', outline: 'none' }}
        type='button'
      >
        <div>点击上传</div>
      </button>
    ),
    []
  );

  const option = useMemo(() => {
    const config = configStore.getConfig;
    const moduleActive = moduleActiveStore.getModuleActive;
    for (const page of config.pages) {
      for (const module of page.modules) {
        if (module.id === moduleActive) {
          let _module = JSON.parse(JSON.stringify(module));
          for (const key in _module.options) {
            if (Object.prototype.hasOwnProperty.call(_module.options, key)) {
              if (key === 'birthday') {
                _module.options[key] = dayjs(_module.options[key]);
              } else if (
                key === 'city' ||
                key === 'intentCity' ||
                key === 'origin'
              ) {
                _module.options[key] =
                  typeof _module.options[key] === 'string'
                    ? _module.options[key].split('/')
                    : _module.options[key];
              }
            }
          }
          return _module.options;
        }
      }
    }
    return null;
  }, [moduleActiveStore.getModuleActive, configStore.getConfig]);

  const formLayout = useMemo(
    () => [
      {
        key: 'name',
        span: 12,
        controllerType: 'input',
      },
      {
        key: 'phone',
        span: 12,
        controllerType: 'input',
      },
      {
        key: 'email',
        span: 12,
        controllerType: 'input',
      },
      {
        key: 'city',
        span: 12,
        controllerType: 'cascader',
        options: city,
      },
      {
        key: 'status',
        span: 12,
        controllerType: 'select',
        options: status,
      },
      {
        key: 'intentCity',
        span: 12,
        controllerType: 'cascader',
        options: intentCity,
      },
      {
        key: 'intentPosts',
        span: 12,
        controllerType: 'input',
      },
      {
        key: 'wechat',
        span: 12,
        controllerType: 'input',
      },
      {
        key: 'birthday',
        span: 12,
        controllerType: 'date-picker',
      },
      {
        key: 'gender',
        span: 12,
        controllerType: 'select',
        options: gender,
      },
      {
        key: 'stature',
        span: 12,
        controllerType: 'input',
      },
      {
        key: 'weight',
        span: 12,
        controllerType: 'input',
      },
      {
        key: 'ethnic',
        span: 12,
        controllerType: 'select',
        options: ethnic,
      },
      {
        key: 'origin',
        span: 12,
        controllerType: 'cascader',
        options: origin,
      },
      {
        key: 'maritalStatus',
        span: 12,
        controllerType: 'select',
        options: maritalStatus,
      },
      {
        key: 'politicalStatus',
        span: 12,
        controllerType: 'select',
        options: politicalStatus,
      },
      {
        key: 'site',
        span: 12,
        controllerType: 'input',
      },
      {
        key: 'expectedSalary',
        span: 12,
        controllerType: 'input-salary',
      },
      {
        key: 'avatar',
        span: 12,
        controllerType: 'image',
      },
    ],
    []
  );

  const filterOption = useMemoizedFn((input: string, option: any) => {
    return option?.label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
  });

  const beforeUpload = useMemoizedFn(async (file, key) => {
    const isJpgOrPng =
      file.type === 'image/jpeg' ||
      file.type === 'image/jpg' ||
      file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('请上传 jpeg, jpg, png 文件');
    }
    cropperRef.current.showModal(await fileToBase64(file), (image: string) => {
      configStore.setConfigOption(moduleActiveStore.getModuleActive, {
        ...configStore.getConfigOption(moduleActiveStore.getModuleActive),
        [key]: image,
      });
    });
    return isJpgOrPng;
  });

  const inputHandler = useMemoizedFn((key: string, value: string) => {
    configStore.setConfigOption(moduleActiveStore.getModuleActive, {
      ...configStore.getConfigOption(moduleActiveStore.getModuleActive),
      [key]: value,
    });
    update(configStore.getConfig);
  });

  return (
    <div className={styles.info1Panel}>
      {option ? (
        <Form form={form} variant='filled' layout='vertical'>
          <Title title='个人信息' />
          <Row gutter={15}>
            {formLayout.map((item) => (
              <Col key={item.key} span={item.span}>
                <Form.Item label={info[item.key as keyof typeof info]}>
                  {item.controllerType === 'input' ? (
                    <Input
                      defaultValue={option[item.key]}
                      placeholder={
                        '请输入' + info[item.key as keyof typeof info]
                      }
                      onChange={(e) => inputHandler(item.key, e.target.value)}
                    />
                  ) : item.controllerType === 'date-picker' ? (
                    <DatePicker
                      defaultValue={option[item.key]}
                      style={{ width: '100%' }}
                      placeholder={
                        '请选择' + info[item.key as keyof typeof info]
                      }
                    />
                  ) : item.controllerType === 'select' ? (
                    <Select
                      defaultValue={option[item.key]}
                      options={item.options}
                      placeholder={
                        '请选择' + info[item.key as keyof typeof info]
                      }
                      showSearch
                      filterOption={filterOption}
                    />
                  ) : item.controllerType === 'input-salary' ? (
                    <div className={styles.inputSalary}>
                      <Input
                        defaultValue={option[item.key][0]}
                        style={{ width: '43%' }}
                        placeholder='薪资'
                      />
                      -
                      <Input
                        defaultValue={option[item.key][1]}
                        style={{ width: '43%' }}
                        placeholder='薪资'
                      />
                    </div>
                  ) : item.controllerType === 'cascader' ? (
                    <Cascader
                      defaultValue={option[item.key]}
                      options={item.options}
                      placeholder={
                        '请选择' + info[item.key as keyof typeof info]
                      }
                    />
                  ) : item.controllerType === 'image' ? (
                    <Upload
                      beforeUpload={(file) => beforeUpload(file, item.key)}
                      showUploadList={false}
                      listType='picture-card'
                    >
                      {option[item.key] ? (
                        <img
                          src={option[item.key]}
                          alt='avatar'
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                          }}
                        />
                      ) : (
                        uploadButton
                      )}
                    </Upload>
                  ) : null}
                </Form.Item>
              </Col>
            ))}
          </Row>
        </Form>
      ) : null}
      <CropperImage ref={cropperRef} />
      <Title title='布局方式' />
      <InfoLayout
        layout={
          configStore.getConfigOption(moduleActiveStore.getModuleActive).layout
        }
      />
    </div>
  );
}

export default memo(observer(Info1));
