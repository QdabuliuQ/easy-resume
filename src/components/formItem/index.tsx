import { Form } from 'antd';
import { memo } from 'react';

function FormItem(props: {
  label: string;
  initialValue?: any;
  icon?: React.ReactNode;
  name?: string;
  labelClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <Form.Item
      className='[&_.ant-form-item-label]:!h-[30px] [&_.ant-form-item-label]:!pb-[5px]'
      label={
        <div className=' flex items-center'>
          {props.icon ? (
            <span className='inline-block mr-[7px]'>{props.icon}</span>
          ) : null}
          <span
            className={
              props.labelClassName ?? 'text-[13px] text-[#4f4f4f]'
            }
          >
            {props.label}
          </span>
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
