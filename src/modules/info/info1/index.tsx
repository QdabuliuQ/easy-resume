'use client';
import { memo, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  formatIntentCityDisplay,
  normalizeResumeCityDisplay,
} from '@/utils/resumeCityDisplay';
import { GlobalStyle } from '@/modules/utils/common.type';
import { RESUME_MODULE_ID_ATTR } from '@/components/moduleOperation/constants';
import { info1ShowsInlineFieldLabel } from '@/lib/info1FieldLabels';
import {
  resumeInfo1FieldSeparatorColor,
  resumeInfo1FieldTextColor,
  resumePageHasSideCol,
} from '@/lib/resumePageLayout';
import SafeText from '@/modules/shared/safeText';
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
    position?: 'left' | 'right' | 'center';
    showTitle?: boolean;
  };
}

interface Props {
  config: InfoProps;
  globalStyle: GlobalStyle;
  forceSideCol?: boolean;
}

function Info1(props: Props) {
  if (!props.config) {
    return null;
  }
  const tField = useTranslations('Edit.info1.fields');
  const tHeader = useTranslations('Edit.header');
  const { id } = props.config;
  const { name, layout, avatar, position: positionOpt, showTitle } = props.config.options;
  const showTitleOn = showTitle === true;
  const position = positionOpt ?? 'right';
  const inSideCol = props.forceSideCol ?? resumePageHasSideCol(props.globalStyle.layout);
  const fieldColor = resumeInfo1FieldTextColor(props.globalStyle.layout);
  const sepColor = resumeInfo1FieldSeparatorColor(props.globalStyle.layout);
  const { fontSize, lineHeight } = props.globalStyle;
  const avatarSrc = typeof avatar === 'string' ? avatar.trim() : '';
  const showAvatar = !!avatarSrc && avatarSrc !== 'avatar';

  const [itemLayout, setItemLayout] = useState<Array<React.ReactNode>>([]);

  useEffect(() => {
    const colon = '：';
    const lbl = (k: string) =>
      info1ShowsInlineFieldLabel(k, showTitleOn) ? `${tField(k as never)}${colon}` : '';
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
          const sal = props.config.options.expectedSalary;
          const a = sal?.[0] ?? '';
          const b = sal?.[1] ?? '';
          rowElements.push(
            <SafeText
              key={`${String(a)}-${String(b)}`}
              selectable
              dataItemId={`${id}_expectedSalary`}
              className={inSideCol ? undefined : 'text-black'}
              style={{ fontSize, lineHeight, color: fieldColor }}
            >
              {lbl('expectedSalary')}
              {a} - {b}
            </SafeText>
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
            <SafeText
              key={`${String(key)}-${i}-${j}`}
              selectable
              dataItemId={`${id}_${String(key)}`}
              className={inSideCol ? undefined : 'text-black'}
              style={{ fontSize, lineHeight, color: fieldColor }}
            >
              {lbl(String(key))}
              {display}
            </SafeText>
          );
        }
        if (j !== row.length - 1) {
          rowElements.push(
            <span
              key={j + '|'}
              className={inSideCol ? 'inline-block mx-[10px]' : 'inline-block mx-[10px] text-[#999]'}
              style={{ fontSize, lineHeight, color: sepColor }}
            >
              |
            </span>
          );
        }
      }
      const rowCls = inSideCol
        ? position === 'center'
          ? 'flex items-center flex-wrap justify-center not-last:mb-[5px]'
          : position === 'left'
            ? 'flex items-center flex-wrap justify-start not-last:mb-[5px]'
            : 'flex items-center flex-wrap justify-end not-last:mb-[5px]'
        : position === 'center'
          ? 'flex items-center flex-wrap justify-center not-last:mb-[5px]'
          : position === 'left'
            ? 'flex items-center flex-wrap justify-end not-last:mb-[5px]'
            : 'flex items-center flex-wrap not-last:mb-[5px]';
      elements.push(
        <div key={i} className={rowCls}>
          {rowElements}
        </div>
      );
    }
    setItemLayout(elements);
  }, [layout, position, showTitleOn, inSideCol, fieldColor, sepColor, props, tField, fontSize, lineHeight]);

  const avatarBlock = showAvatar ? (
    <div
      className={`w-[90px] min-w-[90px] max-w-[90px] shrink-0 ${inSideCol && position === 'center' ? 'mx-auto' : ''} ${inSideCol && position === 'right' ? 'ml-auto' : ''}`}
    >
      <img
        className='aspect-5/7 w-full object-cover'
        src={avatarSrc}
        alt={name?.trim() ? tHeader('avatarAlt', { name: name.trim() }) : tField('avatar')}
      />
    </div>
  ) : null;
  const textAlignSide =
    position === 'center' ? 'text-center' : position === 'left' ? 'text-left' : 'text-right';
  const textBlock = (
    <div
      className={
        inSideCol
          ? `w-full ${textAlignSide}`
          : position === 'center'
            ? 'w-full text-center'
            : position === 'left'
              ? `${showAvatar ? 'min-w-0 flex-1' : 'w-full'} text-right`
              : showAvatar
                ? 'min-w-0 flex-1'
                : 'w-full'
      }
    >
      <SafeText
        className={`mb-[10px] inline-block shrink-0 whitespace-nowrap font-bold leading-none ${inSideCol ? textAlignSide : 'text-black'} ${inSideCol ? '' : position === 'center' ? 'text-center' : ''} ${!inSideCol && position === 'left' ? 'text-right' : ''}`}
        selectable
        dataItemId={`${id}_name`}
        style={{ fontSize: fontSize * 1.7, color: inSideCol ? '#fff' : fieldColor }}
      >
        {name}
      </SafeText>
      <div className='w-full'>{itemLayout}</div>
    </div>
  );
  const rootCls = inSideCol
    ? `flex w-full cursor-pointer flex-col gap-3 ${position === 'center' ? 'items-center' : position === 'left' ? 'items-start' : 'items-end'}`
    : position === 'center' && showAvatar
      ? 'flex w-full cursor-pointer flex-col items-center gap-3'
      : `flex w-full cursor-pointer items-center ${showAvatar ? 'gap-3' : ''} ${showAvatar && (position === 'right' || position === 'left') ? 'justify-between' : ''}`;
  return (
    <div id={id} {...{ [RESUME_MODULE_ID_ATTR]: id }} className={rootCls}>
      {inSideCol ? (
        <>
          {showAvatar ? avatarBlock : null}
          {textBlock}
        </>
      ) : position === 'center' && showAvatar ? (
        <>
          {avatarBlock}
          {textBlock}
        </>
      ) : position === 'left' && showAvatar ? (
        <>
          {avatarBlock}
          {textBlock}
        </>
      ) : (
        <>
          {textBlock}
          {showAvatar ? avatarBlock : null}
        </>
      )}
    </div>
  );
}

export default memo(observer(Info1));
