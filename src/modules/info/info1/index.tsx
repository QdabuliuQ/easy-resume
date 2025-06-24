import { memo, useEffect, useState } from 'react';
import { GlobalStyle } from '@/modules/utils/common.type';
import ModuleOperation from '@/components/moduleOperation';
import { moduleActiveStore } from '@/mobx';
import { observer } from 'mobx-react';

export interface InfoProps {
  id: string;
  type: 'info1';
  options: {
    name: string; // 姓名
    phone: string; // 手机号
    email: string; // 邮件
    city: string; // 当前城市
    status: string; // 当前状态
    intentCity: string; // 意向城市
    intentPosts: string; // 意向职位
    wechat: string; // 微信号
    birthday: string; // 生日
    gender: string; // 性别
    stature: string; // 身高
    weight: string; // 体重
    ethnic: string; // 民族
    origin: string; // 籍贯
    maritalStatus: string; // 婚姻状况
    politicalStatus: string; // 政治面貌
    site: string; // 个人网站
    avatar: string; // 头像
    expectedSalary: Array<string>; // 期望薪资
    layout: Array<Array<string>>; // 布局
  };
}

interface Props {
  config: InfoProps;
  globalStyle: GlobalStyle;
}

function Info1(props: Props) {
  if (!props.config) {
    return null;
  }
  const { id } = props.config;
  const { name, layout, avatar } = props.config.options;
  const { fontSize, lineHeight } = props.globalStyle;

  const [itemLayout, setItemLayout] = useState<Array<React.ReactNode>>([]);

  useEffect(() => {
    const elements = [];
    for (let i = 0; i < layout.length; i++) {
      const row = layout[i];
      const rowElements = [];
      for (let j = 0; j < row.length; j++) {
        const key = row[j];
        if (key === 'avatar' || key === 'name' || key === 'layout') {
          continue;
        }
        if (key === 'expectedSalary') {
          rowElements.push(
            <span
              key={
                ((props.config.options[
                  key as keyof InfoProps['options']
                ][0] as string) +
                  props.config.options[
                    key as keyof InfoProps['options']
                  ][1]) as string
              }
              className='text-[#333]'
              style={{ fontSize, lineHeight }}
            >
              {props.config.options[key as keyof InfoProps['options']][0]} -{' '}
              {props.config.options[key as keyof InfoProps['options']][1]}
            </span>
          );
        } else if (props.config.options[key as keyof InfoProps['options']]) {
          rowElements.push(
            <span
              key={
                props.config.options[
                  key as keyof InfoProps['options']
                ] as string
              }
              className='text-[#333]'
              style={{ fontSize, lineHeight }}
            >
              {props.config.options[key as keyof InfoProps['options']]}
            </span>
          );
        }
        if (j !== row.length - 1) {
          rowElements.push(
            <span
              key={j + '|'}
              className='inline-block mx-[10px] text-[#999]'
              style={{ fontSize, lineHeight }}
            >
              |
            </span>
          );
        }
      }
      elements.push(
        <div key={i} className='flex items-center flex-wrap not-last:mb-[5px]'>
          {rowElements}
        </div>
      );
    }
    setItemLayout(elements);
  }, [layout, props]);

  return (
    <ModuleOperation
      id={id}
      isActive={id === moduleActiveStore.getModuleActive}
    >
      <div
        id={id}
        className='w-full flex justify-between items-center cursor-pointer'
      >
        <div className='flex-1'>
          <div className='mb-[10px] text-[24px] font-bold text-[#333] leading-none'>
            {name}
          </div>
          <div className='w-full'>{itemLayout}</div>
        </div>
        <div className='w-[90px] min-w-[90px] max-w-[90px]'>
          <img
            className='w-full aspect-5/7 object-cover'
            src={avatar}
            alt='avatar'
          />
        </div>
      </div>
    </ModuleOperation>
  );
}

export default memo(observer(Info1));
