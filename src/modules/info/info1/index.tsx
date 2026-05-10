import { memo, useEffect, useState } from 'react';
import {
  formatIntentCityDisplay,
  normalizeResumeCityDisplay,
} from '@/utils/resumeCityDisplay';
import { GlobalStyle } from '@/modules/utils/common.type';
import { RESUME_MODULE_ID_ATTR } from '@/components/moduleOperation/constants';
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
    intentCity: string | string[][]; // 意向城市（多选为 Cascader 路径数组）
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
  const avatarSrc = typeof avatar === 'string' ? avatar.trim() : '';
  const showAvatar = !!avatarSrc && avatarSrc !== 'avatar';

  const [itemLayout, setItemLayout] = useState<Array<React.ReactNode>>([]);

  useEffect(() => {
    const elements: React.ReactNode[] = [];
    for (let i = 0; i < layout.length; i++) {
      const row = layout[i];
      const rowElements: React.ReactNode[] = [];
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
          const val = props.config.options[key as keyof InfoProps['options']];
          const display =
            key === 'city'
              ? normalizeResumeCityDisplay(String(val))
              : key === 'intentCity'
                ? formatIntentCityDisplay(val as unknown)
                : String(val);
          rowElements.push(
            <span
              key={`${String(key)}-${i}-${j}`}
              className='text-[#333]'
              style={{ fontSize, lineHeight }}
            >
              {display}
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
    <div
      id={id}
      {...{ [RESUME_MODULE_ID_ATTR]: id }}
      className={`flex w-full cursor-pointer items-center ${showAvatar ? 'justify-between gap-3' : ''}`}
    >
      <div className={showAvatar ? 'min-w-0 flex-1' : 'w-full'}>
        <div
          className='mb-[10px] font-bold text-[#333] leading-none'
          style={{ fontSize: fontSize * 1.7 }}
        >
          {name}
        </div>
        <div className='w-full'>{itemLayout}</div>
      </div>
      {showAvatar ? (
        <div className='w-[90px] min-w-[90px] max-w-[90px] shrink-0'>
          <img className='aspect-5/7 w-full object-cover' src={avatarSrc} alt='avatar' />
        </div>
      ) : null}
    </div>
  );
}

export default memo(observer(Info1));
