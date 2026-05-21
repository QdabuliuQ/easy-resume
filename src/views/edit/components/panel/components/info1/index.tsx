'use client';
import { observer } from 'mobx-react';
import { memo, useMemo, useRef, type CSSProperties, type MouseEvent } from 'react';
import { UserOutlined } from '@ant-design/icons';
import {
  Cascader,
  Col,
  Form,
  Input,
  message,
  Row,
  Switch,
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
import ResponsiveSelect from '@/components/responsiveSelect';
import { useAppMessage } from '@/hooks/useAppMessage';
import { ResponsiveDatePicker } from '@/components/responsiveDatePicker';
import { fileToBase64 } from '@/utils';
import { info1ShowsInlineFieldLabel } from '@/lib/info1FieldLabels';
import { formatIntentCityDisplay, normalizeIntentCityToCascaderValue } from '@/utils/resumeCityDisplay';
import { configStore, moduleActiveStore } from '@/mobx';
import dayjs from 'dayjs';
import InfoLayout from '@/components/infoLayout';
import PanelToolbar from '../panelToolbar';
import { useTranslations } from 'next-intl';
import {
  AlignLeft,
  AutoHeightOne,
  Avatar,
  Delete,
  BirthdayCake,
  BoyTwo,
  Briefcase,
  BuildingTwo,
  City,
  EditName,
  Family,
  Finance,
  IdCardV,
  LocalTwo,
  Mail,
  Male,
  PhoneCall,
  WebPage,
  Wechat,
  Weight,
  Workbench,
} from '@icon-park/react';

const FORM_ICON_FILL = 'var(--panel-form-icon)';

const SKIP_LAYOUT_KEYS = new Set(['avatar', 'name', 'layout']);
const POSITION_OPTS = [
  { value: 'left', labelKey: 'positionLeft' as const },
  { value: 'right', labelKey: 'positionRight' as const },
  { value: 'center', labelKey: 'positionCenter' as const },
];

function formatPreviewValue(key: string, opt: Record<string, unknown>): string {
  const v = opt[key];
  if (key === 'expectedSalary' && Array.isArray(v)) {
    const [a, b] = v as [unknown, unknown];
    if (a == null && b == null) return '—';
    return [a, b].filter((x) => x != null && String(x) !== '').join(' - ') || '—';
  }
  if (key === 'intentCity') {
    return formatIntentCityDisplay(v) || '—';
  }
  if (key === 'birthday' && v != null && typeof v === 'object' && typeof (v as { format?: (f: string) => string }).format === 'function') {
    return (v as { format: (f: string) => string }).format('YYYY-MM-DD');
  }
  if ((key === 'city' || key === 'origin') && Array.isArray(v)) {
    const s = (v as unknown[]).filter(Boolean).join('/');
    return s || '—';
  }
  if (v == null || v === '') return '—';
  return String(v);
}

function Info1({ moduleId }: { moduleId?: string } = {}) {
  const message = useAppMessage();
  const ti = useTranslations('Edit.info1');
  const th = useTranslations('Edit.header');
  const [form] = Form.useForm();
  const cropperRef = useRef<any>(null);
  const mid = moduleId ?? moduleActiveStore.getModuleActive;
  const editOpen = moduleActiveStore.getModuleActive === mid;
  const uploadButton = useMemo(
    () => (
      <button
        className='flex h-[140px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-fg/15 bg-surface/[0.03] p-0 text-fg/55 outline-none transition-colors hover:border-[color:var(--color-primary)] hover:bg-surface/[0.05] hover:text-fg/80'
        type='button'
      >
        <Avatar theme='outline' size='22' fill='currentColor' />
        <div className='mt-2 text-[12px]'>{ti('uploadAvatar')}</div>
      </button>
    ),
    [ti]
  );

  const option = useMemo(() => {
    const config = configStore.getConfig;
    for (const page of config.pages) {
      for (const module of page.modules) {
        if (module.id === mid) {
          let _module = JSON.parse(JSON.stringify(module));
          for (const key in _module.options) {
            if (Object.prototype.hasOwnProperty.call(_module.options, key)) {
              if (key === 'birthday') {
                _module.options[key] = dayjs(_module.options[key]);
              } else if (key === 'intentCity') {
                _module.options[key] = normalizeIntentCityToCascaderValue(
                  _module.options[key]
                );
              } else if (key === 'city' || key === 'origin') {
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
  }, [mid, configStore.getConfig]);

  const avatarValue =
    typeof option?.avatar === 'string' ? option.avatar.trim() : '';
  const showAvatar = !!avatarValue && avatarValue !== 'avatar';

  const formLayout = useMemo(
    () => [
      {
        key: 'name',
        span: 12,
        controllerType: 'input',
        icon: <EditName theme='outline' size='15' fill={FORM_ICON_FILL} />,
      },
      {
        key: 'phone',
        span: 12,
        controllerType: 'input',
        icon: <PhoneCall theme='outline' size='15' fill={FORM_ICON_FILL} />,
      },
      {
        key: 'email',
        span: 12,
        controllerType: 'input',
        icon: <Mail theme='outline' size='15' fill={FORM_ICON_FILL} />,
      },
      {
        key: 'city',
        span: 12,
        controllerType: 'cascader',
        options: city,
        icon: <City theme='outline' size='15' fill={FORM_ICON_FILL} />,
      },
      {
        key: 'status',
        span: 12,
        controllerType: 'select',
        options: status,
        icon: <Workbench theme='outline' size='15' fill={FORM_ICON_FILL} />,
      },
      {
        key: 'intentCity',
        span: 12,
        controllerType: 'cascader',
        options: intentCity,
        icon: <BuildingTwo theme='outline' size='15' fill={FORM_ICON_FILL} />,
      },
      {
        key: 'intentPosts',
        span: 12,
        controllerType: 'input',
        icon: <Briefcase theme='outline' size='15' fill={FORM_ICON_FILL} />,
      },
      {
        key: 'wechat',
        span: 12,
        controllerType: 'input',
        icon: <Wechat theme='outline' size='15' fill={FORM_ICON_FILL} />,
      },
      {
        key: 'birthday',
        span: 12,
        controllerType: 'date-picker',
        icon: <BirthdayCake theme='outline' size='15' fill={FORM_ICON_FILL} />,
      },
      {
        key: 'gender',
        span: 12,
        controllerType: 'select',
        options: gender,
        icon: <Male theme='outline' size='15' fill={FORM_ICON_FILL} />,
      },
      {
        key: 'stature',
        span: 12,
        controllerType: 'input',
        icon: <AutoHeightOne theme='outline' size='15' fill={FORM_ICON_FILL} />,
      },
      {
        key: 'weight',
        span: 12,
        controllerType: 'input',
        icon: <Weight theme='outline' size='15' fill={FORM_ICON_FILL} />,
      },
      {
        key: 'ethnic',
        span: 12,
        controllerType: 'select',
        options: ethnic,
        icon: <BoyTwo theme='outline' size='15' fill={FORM_ICON_FILL} />,
      },
      {
        key: 'origin',
        span: 12,
        controllerType: 'cascader',
        options: origin,
        icon: <LocalTwo theme='outline' size='15' fill={FORM_ICON_FILL} />,
      },
      {
        key: 'maritalStatus',
        span: 12,
        controllerType: 'select',
        options: maritalStatus,
        icon: <Family theme='outline' size='15' fill={FORM_ICON_FILL} />,
      },
      {
        key: 'politicalStatus',
        span: 12,
        controllerType: 'select',
        options: politicalStatus,
        icon: <IdCardV theme='outline' size='15' fill={FORM_ICON_FILL} />,
      },
      {
        key: 'site',
        span: 12,
        controllerType: 'input',
        icon: <WebPage theme='outline' size='15' fill={FORM_ICON_FILL} />,
      },
      {
        key: 'expectedSalary',
        span: 12,
        controllerType: 'input-salary',
        icon: <Finance theme='outline' size='15' fill={FORM_ICON_FILL} />,
      },
      {
        key: 'avatar',
        span: 12,
        controllerType: 'image',
        icon: <Avatar theme='outline' size='15' fill={FORM_ICON_FILL} />,
      },
    ],
    []
  );

  const filterOption = useMemoizedFn((input: string, option: any) => {
    return option?.label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
  });

  const removeAvatar = useMemoizedFn((e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    configStore.setConfigOption(mid, {
      ...configStore.getConfigOption(mid),
      avatar: '',
    });
  });

  const beforeUpload = useMemoizedFn(async (file: File, key: string) => {
    const mimeOk =
      file.type === 'image/jpeg' ||
      file.type === 'image/jpg' ||
      file.type === 'image/png';
    const extOk = /\.(jpe?g|png)$/i.test(file.name ?? '');
    const ok = mimeOk || (!file.type && extOk);
    if (!ok) {
      message.error(ti('imageFormatError'));
      return Upload.LIST_IGNORE;
    }
    cropperRef.current.showModal(await fileToBase64(file), (image: string) => {
      configStore.setConfigOption(mid, {
        ...configStore.getConfigOption(mid),
        [key]: image,
      });
    });
    return false;
  });

  const inputHandler = useMemoizedFn((key: string, value: string) => {
    configStore.setConfigOption(mid, {
      ...configStore.getConfigOption(mid),
      [key]: value,
    });
  });

  const salaryValue = useMemo<[string, string]>(() => {
    const raw = option?.expectedSalary;
    if (Array.isArray(raw)) {
      return [
        raw[0] == null ? '' : String(raw[0]),
        raw[1] == null ? '' : String(raw[1]),
      ];
    }
    return ['', ''];
  }, [option]);

  const salaryInputHandler = useMemoizedFn((index: 0 | 1, value: string) => {
    const current = configStore.getConfigOption(mid)?.expectedSalary;
    const next: [string, string] = Array.isArray(current)
      ? [
          current[0] == null ? '' : String(current[0]),
          current[1] == null ? '' : String(current[1]),
        ]
      : ['', ''];
    next[index] = value;
    configStore.setConfigOption(mid, {
      ...configStore.getConfigOption(mid),
      expectedSalary: next,
    });
  });

  const formatLayout = useMemoizedFn((layout: Array<any>) => {
    const sorted = [...layout].sort((a, b) =>
      a.y !== b.y ? a.y - b.y : a.x - b.x
    );
    const newLayout: Array<Array<string>> = [];
    let prevY = -Infinity;
    for (const item of sorted) {
      if (prevY !== item.y) {
        newLayout.push([]);
        prevY = item.y;
      }
      newLayout[newLayout.length - 1].push(item.i);
    }
    return newLayout;
  });

  const onDragStop = useMemoizedFn((newLayout: Array<any>) => {
    configStore.setConfigOption(mid, {
      ...configStore.getConfigOption(mid),
      layout: formatLayout(newLayout),
    });
  });

  const previewByLayout = useMemo(() => {
    if (!option) return null;
    const layout = option.layout as string[][] | undefined;
    if (!layout?.length) return null;
    const st = option.showTitle === true;
    const colon = '：';
    const rows: string[] = [];
    for (const rowKeys of layout) {
      const parts = rowKeys
        .filter((k) => !SKIP_LAYOUT_KEYS.has(k))
        .map((k) => {
          const v = formatPreviewValue(k, option as Record<string, unknown>);
          return info1ShowsInlineFieldLabel(k, st)
            ? `${ti(`fields.${k}` as never)}${colon}${v}`
            : v;
        });
      if (parts.length) {
        rows.push(parts.join(' | '));
      }
    }
    return rows.length ? rows : null;
  }, [option, ti]);

  return (
    <div className='[&_.ant-form-item-label]:!pb-[5px] [&_.ant-form-item-label]:!h-[30px]'>
      <div className='panel-module-head'>
        <div className='panel-module-head-main'>
          <svg
            width={0}
            height={0}
            className='pointer-events-none size-0 shrink-0 overflow-hidden'
            aria-hidden
          >
            <defs>
              <linearGradient
                id='info1-user-grad'
                x1='0%'
                y1='0%'
                x2='100%'
                y2='100%'
              >
                <stop offset='0%' stopColor='var(--color-primary-gradient-start)' />
                <stop offset='100%' stopColor='var(--color-primary)' />
              </linearGradient>
            </defs>
          </svg>
          <div
            className='panel-module-icon text-base [&_.anticon_svg_path]:!fill-[var(--info1-icon-fill)]'
            style={
              {
                ['--info1-icon-fill']: 'url(#info1-user-grad)',
              } as CSSProperties
            }
            aria-hidden
          >
            <UserOutlined />
          </div>
          <span className='panel-module-label'>
            {ti('basicInfoLabel')}
          </span>
        </div>
        <PanelToolbar moduleId={mid} />
      </div>

      {!editOpen && option && (
        <div
          key='preview'
          className='panel-module-preview info1-panel-animate text-fg/95'
        >
          {previewByLayout ? (
            <div className='flex flex-col gap-2 break-all text-[13px] text-fg/75'>
              <div>{formatPreviewValue('name', option as Record<string, unknown>)}</div>
              {previewByLayout.map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
          ) : (
            <div className='break-all text-[13px] text-fg/75'>
              {[
                option.phone == null || option.phone === ''
                  ? '—'
                  : String(option.phone),
                option.email == null || option.email === ''
                  ? '—'
                  : String(option.email),
              ].join(' | ')}
            </div>
          )}
        </div>
      )}

      {editOpen && option ? (
        <div
          key='edit'
          className='panel-module-edit info1-panel-animate text-fg/95'
        >
          <p className='mb-3 rounded-md border border-[color:color-mix(in_srgb,var(--color-primary)_52%,transparent)] bg-[color:color-mix(in_srgb,var(--color-primary)_18%,transparent)] px-3 py-2.5 text-[11px] font-medium leading-relaxed text-[color:var(--color-primary)] shadow-[inset_0_1px_0_0_color-mix(in_srgb,var(--color-primary)_28%,transparent)]'>
            <span className='font-semibold'>{ti('hintTitle')}</span>
            ：{ti('hintBody')}
          </p>
          <Form form={form} variant='filled' layout='vertical'>
            <Row gutter={15} className='mb-1'>
              <Col span={24}>
                <Form.Item
                  label={
                    <div className='flex items-center text-fg/85 text-[12px]'>
                      <span className='inline-block mr-[7px]'>
                        <AlignLeft theme='outline' size='15' fill={FORM_ICON_FILL} />
                      </span>
                      {ti('positionLabel')}
                    </div>
                  }
                >
                  <ResponsiveSelect
                    value={(option.position as string) ?? 'right'}
                    options={POSITION_OPTS.map((o) => ({
                      value: o.value,
                      label: ti(o.labelKey),
                    }))}
                    onChange={(value) =>
                      configStore.setConfigOption(mid, {
                        ...configStore.getConfigOption(mid),
                        position: value,
                      })
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={15} className='mb-1'>
              <Col span={24}>
                <Form.Item label={<span className='text-[12px] text-fg/85'>{ti('showTitleLabel')}</span>}>
                  <Switch
                    checked={option.showTitle === true}
                    onChange={(checked) =>
                      configStore.setConfigOption(mid, {
                        ...configStore.getConfigOption(mid),
                        showTitle: checked,
                      })
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={15}>
              {formLayout.map((item) => (
                <Col key={item.key} span={item.span}>
                  <Form.Item
                    label={
                      <div className='flex items-center text-fg/85 text-[12px]'>
                        {item.icon ? (
                          <span className='inline-block mr-[7px]'>
                            {item.icon}
                          </span>
                        ) : null}
                        {ti(`fields.${item.key}` as never)}
                      </div>
                    }
                  >
                    {item.controllerType === 'input' ? (
                      <Input
                        maxLength={30}
                        defaultValue={option[item.key]}
                        placeholder={`${ti('enterPrefix')}${ti(`fields.${item.key}` as never)}`}
                        onChange={(e) => inputHandler(item.key, e.target.value)}
                      />
                    ) : item.controllerType === 'date-picker' ? (
                      <ResponsiveDatePicker
                        defaultValue={option[item.key]}
                        style={{ width: '100%' }}
                        placeholder={`${ti('selectPrefix')}${ti(`fields.${item.key}` as never)}`}
                        onChange={(_, dateString) =>
                          inputHandler(
                            item.key,
                            Array.isArray(dateString)
                              ? dateString.join('/')
                              : dateString || ''
                          )
                        }
                      />
                    ) : item.controllerType === 'select' ? (
                      <ResponsiveSelect
                        defaultValue={option[item.key]}
                        options={item.options}
                        placeholder={`${ti('selectPrefix')}${ti(`fields.${item.key}` as never)}`}
                        showSearch
                        filterOption={filterOption}
                        onChange={(value) => inputHandler(item.key, value)}
                      />
                    ) : item.controllerType === 'input-salary' ? (
                      <div className='w-full flex items-center justify-between'>
                        <Input
                          maxLength={30}
                          defaultValue={salaryValue[0]}
                          style={{ width: '43%' }}
                          placeholder={ti('salaryPh')}
                          onChange={(e) => salaryInputHandler(0, e.target.value)}
                        />
                        -
                        <Input
                          maxLength={30}
                          defaultValue={salaryValue[1]}
                          style={{ width: '43%' }}
                          placeholder={ti('salaryPh')}
                          onChange={(e) => salaryInputHandler(1, e.target.value)}
                        />
                      </div>
                    ) : item.controllerType === 'cascader' ? (
                      <Cascader
                        multiple={item.key === 'intentCity'}
                        maxTagCount='responsive'
                        showCheckedStrategy={
                          item.key === 'intentCity'
                            ? Cascader.SHOW_CHILD
                            : undefined
                        }
                        defaultValue={option[item.key]}
                        options={item.options}
                        placeholder={`${ti('selectPrefix')}${ti(`fields.${item.key}` as never)}`}
                        onChange={(value) => {
                          configStore.setConfigOption(mid, {
                            ...configStore.getConfigOption(mid),
                            [item.key]: value,
                          });
                        }}
                      />
                    ) : item.controllerType === 'image' ? (
                      <Upload
                        beforeUpload={(file) => beforeUpload(file, item.key)}
                        showUploadList={false}
                        className='w-full [&_.ant-upload-wrapper]:w-full [&_.ant-upload-select]:!m-0 [&_.ant-upload-select]:!h-auto [&_.ant-upload-select]:!w-full [&_.ant-upload-select]:!border-0 [&_.ant-upload-select]:!bg-transparent'
                      >
                        {showAvatar ? (
                          <div className='group relative h-[140px] overflow-hidden rounded-xl border border-fg/10 bg-[var(--panel-inset-bg)]'>
                            <img
                              src={avatarValue}
                              alt={
                                (configStore.getConfig?.name ?? '').trim()
                                  ? th('avatarAlt', {
                                      name: (configStore.getConfig?.name ?? '').trim(),
                                    })
                                  : ti('fields.avatar')
                              }
                              className='h-full w-full object-contain'
                            />
                            <button
                              type='button'
                              aria-label={ti('deleteAvatar')}
                              className='absolute right-2 top-2 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[color:color-mix(in_srgb,var(--panel-tone-rose)_28%,transparent)] bg-[color:color-mix(in_srgb,var(--panel-tone-rose)_14%,var(--float-btn-bg))] text-[color:var(--module-op-delete-icon)] opacity-0 shadow-[var(--panel-shadow-icon-btn)] transition-[opacity,transform,background-color,border-color,color] duration-200 hover:border-[color:color-mix(in_srgb,var(--panel-tone-rose)_38%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--panel-tone-rose)_22%,var(--float-btn-bg-hover))] hover:text-[color:var(--module-op-delete-icon-hover)] group-hover:opacity-100'
                              onClick={removeAvatar}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <Delete theme='outline' size='16' fill='currentColor' />
                            </button>
                          </div>
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
          {configStore.getConfigOption(mid)?.layout ? (
            <InfoLayout
              layout={configStore.getConfigOption(mid)!.layout}
              onDragStop={onDragStop}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default memo(observer(Info1));
