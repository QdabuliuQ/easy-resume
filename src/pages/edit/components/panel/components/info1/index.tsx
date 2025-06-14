import { observer } from 'mobx-react';
import { memo, useMemo, useRef, useState } from 'react';
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
} from '@/modules/utils/constant';
import { useMemoizedFn } from 'ahooks';
import CropperImage from '@/components/cropperImage';
import { fileToBase64 } from '@/utils';

function Info1() {
  const [form] = Form.useForm();
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

  const formLayout = useMemo(
    () => [
      {
        label: '姓名',
        key: 'name',
        span: 12,
        controllerType: 'input',
      },
      {
        label: '手机号',
        key: 'phone',
        span: 12,
        controllerType: 'input',
      },
      {
        label: '邮箱',
        key: 'email',
        span: 12,
        controllerType: 'input',
      },
      {
        label: '所在城市',
        key: 'city',
        span: 12,
        controllerType: 'cascader',
        options: city,
      },
      {
        label: '状态',
        key: 'status',
        span: 12,
        controllerType: 'select',
        options: status,
      },
      {
        label: '意向城市',
        key: 'intentCity',
        span: 12,
        controllerType: 'cascader',
        options: intentCity,
      },
      {
        label: '意向岗位',
        key: 'intentPosts',
        span: 12,
        controllerType: 'input',
      },
      {
        label: '微信',
        key: 'wechat',
        span: 12,
        controllerType: 'input',
      },
      {
        label: '生日',
        key: 'birthday',
        span: 12,
        controllerType: 'date-picker',
      },
      {
        label: '性别',
        key: 'gender',
        span: 12,
        controllerType: 'select',
        options: gender,
      },
      {
        label: '身高',
        key: 'stature',
        span: 12,
        controllerType: 'input',
      },
      {
        label: '体重',
        key: 'weight',
        span: 12,
        controllerType: 'input',
      },
      {
        label: '民族',
        key: 'ethnic',
        span: 12,
        controllerType: 'select',
        options: ethnic,
      },
      {
        label: '籍贯',
        key: 'origin',
        span: 12,
        controllerType: 'cascader',
        options: origin,
      },
      {
        label: '婚姻状况',
        key: 'maritalStatus',
        span: 12,
        controllerType: 'select',
        options: maritalStatus,
      },
      {
        label: '政治面貌',
        key: 'politicalStatus',
        span: 12,
        controllerType: 'select',
        options: politicalStatus,
      },
      {
        label: '个人网站',
        key: 'site',
        span: 12,
        controllerType: 'input',
      },
      {
        label: '期望薪资',
        key: 'expectedSalary',
        span: 12,
        controllerType: 'input-salary',
      },
      {
        label: '头像',
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

  const [imageUrl, setImageUrl] = useState('');

  const beforeUpload = useMemoizedFn(async (file) => {
    const isJpgOrPng =
      file.type === 'image/jpeg' ||
      file.type === 'image/jpg' ||
      file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('请上传 jpeg, jpg, png 文件');
    }
    console.log(isJpgOrPng, 'isJpgOrPng');
    cropperRef.current.showModal(await fileToBase64(file), (image: string) => {
      console.log(image, 'image');
      setImageUrl(image);
    });
    return isJpgOrPng;
  });

  return (
    <div className={styles.info1Panel}>
      <Form form={form} variant='filled' layout='vertical'>
        <Row gutter={15}>
          {formLayout.map((item) => (
            <Col key={item.key} span={item.span}>
              <Form.Item label={item.label}>
                {item.controllerType === 'input' ? (
                  <Input placeholder={'请输入' + item.label} />
                ) : item.controllerType === 'date-picker' ? (
                  <DatePicker
                    style={{ width: '100%' }}
                    placeholder={'请选择' + item.label}
                  />
                ) : item.controllerType === 'select' ? (
                  <Select
                    options={item.options}
                    placeholder={'请选择' + item.label}
                    showSearch
                    filterOption={filterOption}
                  />
                ) : item.controllerType === 'input-salary' ? (
                  <div className={styles.inputSalary}>
                    <Input style={{ width: '43%' }} placeholder='薪资' />
                    -
                    <Input style={{ width: '43%' }} placeholder='薪资' />
                  </div>
                ) : item.controllerType === 'cascader' ? (
                  <Cascader
                    options={item.options}
                    placeholder={'请选择' + item.label}
                  />
                ) : item.controllerType === 'image' ? (
                  <Upload
                    beforeUpload={beforeUpload}
                    showUploadList={false}
                    listType='picture-card'
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
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
      <CropperImage ref={cropperRef} />
    </div>
  );
}

export default memo(observer(Info1));
