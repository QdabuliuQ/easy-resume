import { Form } from 'antd';
import { memo } from 'react';
import styles from './index.module.less';

function FormItem(props: {
  label: string;
  initialValue?: any;
  icon?: React.ReactNode;
  name?: string;
  children: React.ReactNode;
}) {
  return (
    <Form.Item
      className={styles.formItem}
      label={
        <div className=' flex items-center'>
          {props.icon ? (
            <span className='inline-block mr-[7px]'>{props.icon}</span>
          ) : null}
          <span className='text-[13px] text-[#4f4f4f]'>{props.label}</span>
        </div>
      }
      initialValue={props.initialValue}
      name={props.name}
    >
      {props.children}
    </Form.Item>
  );
}

export default memo(FormItem);
