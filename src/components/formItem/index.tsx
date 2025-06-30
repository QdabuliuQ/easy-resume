import { Form } from 'antd';
import { memo } from 'react';

function FormItem(props: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Form.Item
      label={
        <div className='flex items-center'>
          {props.icon ? (
            <span className='inline-block mr-[7px]'>{props.icon}</span>
          ) : null}
          <span className='text-[13px] text-[#4f4f4f]'>{props.label}</span>
        </div>
      }
    >
      {props.children}
    </Form.Item>
  );
}

export default memo(FormItem);
