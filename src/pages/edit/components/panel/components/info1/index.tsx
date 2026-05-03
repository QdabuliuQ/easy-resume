import { observer } from 'mobx-react';
import { memo, useMemo, useRef, type CSSProperties } from 'react';
import { UserOutlined } from '@ant-design/icons';
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
import PanelToolbar from '../panelToolbar';
import {
  AutoHeightOne,
  Avatar,
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

const FORM_ICON_FILL = 'rgba(255, 255, 255, 0.7)';

const SKIP_LAYOUT_KEYS = new Set(['avatar', 'name', 'layout']);

function formatPreviewValue(key: string, opt: Record<string, unknown>): string {
  const v = opt[key];
  if (key === 'expectedSalary' && Array.isArray(v)) {
    const [a, b] = v as [unknown, unknown];
    if (a == null && b == null) return '—';
    return [a, b].filter((x) => x != null && String(x) !== '').join(' - ') || '—';
  }
  if (key === 'birthday' && v != null && typeof v === 'object' && typeof (v as { format?: (f: string) => string }).format === 'function') {
    return (v as { format: (f: string) => string }).format('YYYY-MM-DD');
  }
  if (
    (key === 'city' || key === 'intentCity' || key === 'origin') &&
    Array.isArray(v)
  ) {
    const s = (v as unknown[]).filter(Boolean).join('/');
    return s || '—';
  }
  if (v == null || v === '') return '—';
  return String(v);
}

function Info1({ moduleId }: { moduleId?: string } = {}) {
  const [form] = Form.useForm();
  const cropperRef = useRef<any>(null);
  const mid = moduleId ?? moduleActiveStore.getModuleActive;
  const editOpen = moduleActiveStore.getModuleActive === mid;
  const uploadButton = useMemo(
    () => (
      <button
        className='border-0 bg-transparent p-0 outline-none'
        type='button'
      >
        <div>点击上传</div>
      </button>
    ),
    []
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
  }, [mid, configStore.getConfig]);

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

  const beforeUpload = useMemoizedFn(async (file, key) => {
    const isJpgOrPng =
      file.type === 'image/jpeg' ||
      file.type === 'image/jpg' ||
      file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('请上传 jpeg, jpg, png 文件');
    }
    cropperRef.current.showModal(await fileToBase64(file), (image: string) => {
      configStore.setConfigOption(mid, {
        ...configStore.getConfigOption(mid),
        [key]: image,
      });
    });
    return isJpgOrPng;
  });

  const inputHandler = useMemoizedFn((key: string, value: string) => {
    configStore.setConfigOption(mid, {
      ...configStore.getConfigOption(mid),
      [key]: value,
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
    const rows: string[] = [];
    for (const rowKeys of layout) {
      const parts = rowKeys
        .filter((k) => !SKIP_LAYOUT_KEYS.has(k))
        .map((k) => formatPreviewValue(k, option as Record<string, unknown>));
      if (parts.length) {
        rows.push(parts.join(' | '));
      }
    }
    return rows.length ? rows : null;
  }, [option]);

  return (
    <div className='[&_.ant-form-item-label]:!pb-[5px] [&_.ant-form-item-label]:!h-[30px]'>
      <div className='mb-3 flex items-center justify-between'>
        <div className='flex items-center'>
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
            className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-base [&_.anticon_svg_path]:!fill-[var(--info1-icon-fill)]'
            style={
              {
                ['--info1-icon-fill']: 'url(#info1-user-grad)',
              } as CSSProperties
            }
            aria-hidden
          >
            <UserOutlined />
          </div>
          <span className='text-[15px] font-medium text-white/95 ml-[10px]'>
            基本信息
          </span>
        </div>
        <PanelToolbar moduleId={mid} />
      </div>

      {!editOpen && option && (
        <div
          key='preview'
          className='info1-panel-animate rounded-lg border border-white/[0.08] bg-white/[0.06] px-3.5 py-3 text-white/95'
        >
          {previewByLayout ? (
            <div className='flex flex-col gap-2 break-all text-[13px] text-white/75'>
              {previewByLayout.map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
          ) : (
            <div className='break-all text-[13px] text-white/75'>
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
          className='info1-panel-animate mt-1 rounded-lg border border-white/[0.08] bg-white/[0.06] p-[10px] text-white/95'
        >
          <Form form={form} variant='filled' layout='vertical'>
            <Row gutter={15}>
              {formLayout.map((item) => (
                <Col key={item.key} span={item.span}>
                  <Form.Item
                    label={
                      <div className='flex items-center text-white/85 text-[12px]'>
                        {item.icon ? (
                          <span className='inline-block mr-[7px]'>
                            {item.icon}
                          </span>
                        ) : null}
                        {info[item.key as keyof typeof info]}
                      </div>
                    }
                  >
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
                        onChange={(value) => inputHandler(item.key, value)}
                      />
                    ) : item.controllerType === 'input-salary' ? (
                      <div className='w-full flex items-center justify-between'>
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
