import FormItem from '@/components/formItem';
import { polishEducationDescriptionWithBigmodel } from '@/api/educationDescriptionPolish';
import { useModuleHandle } from '@/hooks/module';
import { configStore, moduleActiveStore } from '@/mobx';
import {
  Calendar,
  EditOne,
  DegreeHat,
  School,
  Bookmark,
  City,
  Notes,
  BuildingFour,
} from '@icon-park/react';
import { ReadOutlined } from '@ant-design/icons';
import { useDebounceFn, useMemoizedFn } from 'ahooks';
import {
  Cascader,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  Row,
  Select,
} from 'antd';
import dayjs from 'dayjs';
import { observer } from 'mobx-react';
import {
  memo,
  useEffect,
  useId,
  useState,
  type CSSProperties,
} from 'react';
import AddGradientButton from '../addGradientButton';
import ButtonGroup from '../buttonGroup';
import { city, degree, schoolType } from '@/modules/utils/constant';
import { EducationProps } from '@/modules/education';
import SplitLine from '../splitLine';
import ModulePanelTitleEdit from '../modulePanelTitleEdit';
import PanelToolbar from '../panelToolbar';
import RichTextEditor from '@/components/richTextEditor';

const FORM_ICON_FILL = 'rgba(255, 255, 255, 0.7)';

function intentPostsFromResumeConfig(
  config: { pages?: { modules?: { type?: string; options?: { intentPosts?: string } }[] }[] } | null
): string {
  if (!config?.pages) return '';
  for (const page of config.pages) {
    for (const m of page.modules ?? []) {
      if (m.type === 'info1' && m.options?.intentPosts != null) {
        return String(m.options.intentPosts).trim();
      }
    }
  }
  return '';
}

function Education({ moduleId }: { moduleId?: string } = {}) {
  const { getModule, getModuleIndex } = useModuleHandle();
  const moduleActive = moduleId ?? moduleActiveStore.getModuleActive;
  const editOpen = moduleActiveStore.getModuleActive === moduleActive;
  const [module, setModule] = useState<EducationProps | null>(null);
  const gradId = useId().replace(/:/g, '');
  const iconGradId = `education-icon-grad-${gradId}`;

  useEffect(() => {
    const m = getModule(moduleActive);
    if (m) {
      setModule(JSON.parse(JSON.stringify(m)));
    } else {
      setModule(null);
    }
  }, [moduleActive, getModule]);

  const { run } = useDebounceFn(
    (mod: EducationProps) => {
      const config = configStore.getConfig;
      if (!config) return;
      const res = getModuleIndex(moduleActive);
      if (!res) return;
      config.pages[res.page].modules[res.module] = JSON.parse(
        JSON.stringify(mod)
      );
      configStore.setConfig({
        ...config,
        pages: [...config.pages],
      });
    },
    { wait: 100 }
  );

  const updateModule = useMemoizedFn((module: EducationProps) => {
    const _module = JSON.parse(JSON.stringify(module));
    setModule(_module);
    run(_module);
  });

  const handleAdd = useMemoizedFn(() => {
    if (!module) return;
    module.options.items.unshift({
      school: '',
      degree: undefined as any,
      major: '',
      city: '',
      tags: [],
      academy: '',
      startDate: undefined as any,
      endDate: undefined as any,
      description: '',
    });
    updateModule(module);
  });

  const handleUp = useMemoizedFn((index: number) => {
    if (!module) return;
    const item = module.options.items[index];
    module.options.items[index] = module.options.items[index - 1];
    module.options.items[index - 1] = item;
    updateModule(module);
  });

  const handleDown = useMemoizedFn((index: number) => {
    if (!module) return;
    const item = module.options.items[index];
    module.options.items[index] = module.options.items[index + 1];
    module.options.items[index + 1] = item;
    updateModule(module);
  });

  const handleDelete = useMemoizedFn((index: number) => {
    if (!module) return;
    module.options.items.splice(index, 1);
    updateModule(module);
  });

  const handleCopy = useMemoizedFn((index: number) => {
    if (!module) return;
    module.options.items.splice(
      index,
      0,
      JSON.parse(JSON.stringify(module.options.items[index]))
    );
    updateModule(module);
  });

  const handleDescriptionHtml = useMemoizedFn((index: number, html: string) => {
    if (!module) return;
    module.options.items[index].description = html;
    updateModule(module);
  });

  const intentPostsForPolish = intentPostsFromResumeConfig(configStore.getConfig);

  const handleChange = useMemoizedFn((e: any, index: number, key: string) => {
    if (!module) return;
    if (
      key === 'school' ||
      key === 'major' ||
      key === 'academy'
    ) {
      module.options.items[index][key] = e.target.value;
    } else if (key === 'degree' || key === 'tags') {
      module.options.items[index][key] = e;
    } else if (key === 'date') {
      module.options.items[index].startDate = e[0].format('YYYY-MM');
      module.options.items[index].endDate = e[1].format('YYYY-MM');
    } else if (key === 'city') {
      module.options.items[index][key] = e.join(' - ');
    }
    updateModule(module);
  });

  return (
    <div className='[&_.ant-form-item]:!mb-2.5'>
      <div className='mb-3 flex min-w-0 items-center justify-between gap-2'>
        <div className='flex min-w-0 flex-1 items-center'>
          <svg
            width={0}
            height={0}
            className='pointer-events-none size-0 shrink-0 overflow-hidden'
            aria-hidden
          >
            <defs>
              <linearGradient
                id={iconGradId}
                x1='0%'
                y1='0%'
                x2='100%'
                y2='100%'
              >
                <stop offset='0%' stopColor='#93c5fd' />
                <stop offset='100%' stopColor='#6366f1' />
              </linearGradient>
            </defs>
          </svg>
          <div
            className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-base [&_.anticon_svg_path]:!fill-[var(--edu-icon-fill)]'
            style={
              {
                ['--edu-icon-fill']: `url(#${iconGradId})`,
              } as CSSProperties
            }
            aria-hidden
          >
            <ReadOutlined />
          </div>
          <ModulePanelTitleEdit
            resetKey={moduleActive}
            title={module?.options?.title ?? ''}
            fallbackTitle='教育经历'
            disabled={!module}
            onCommit={(next) => {
              if (!module) return;
              module.options.title = next;
              updateModule(module);
            }}
          />
        </div>
        <PanelToolbar moduleId={moduleActive} />
      </div>

      {!editOpen && module && (
        <div
          key='preview'
          className='info1-panel-animate rounded-lg border border-white/[0.08] bg-white/[0.06] px-3.5 py-3 text-white/95'
        >
          {module.options.items.length === 0 ? (
            <div className='text-[13px] text-white/75'>暂无教育经历条目</div>
          ) : (
            <>
              <div className='flex max-h-[240px] flex-col gap-1.5 overflow-y-auto'>
                {module.options.items.slice(0, 10).map((item: any, i: number) => (
                  <div
                    key={i}
                    className='break-all text-[13px] text-white/75'
                  >
                    {item.school || '—'} · {item.major || '—'}{' '}
                    {item.startDate && item.endDate
                      ? `${item.startDate} ~ ${item.endDate}`
                      : '—'}
                  </div>
                ))}
              </div>
              <div className='pt-2 text-[12px] text-white/45'>
                共 {module.options.items.length} 条
                {module.options.items.length > 10
                  ? '（预览仅显示前 10 条）'
                  : ''}
              </div>
            </>
          )}
        </div>
      )}

      {editOpen && module ? (
        <div
          key='edit'
          className='info1-panel-animate mt-1 rounded-lg border border-white/[0.08] bg-white/[0.06] p-[10px] text-white/95'
        >
          <AddGradientButton onClick={handleAdd}>添加教育经历</AddGradientButton>
          {module.options.items.length > 0 ? (
            module.options.items.map((item: any, index: number) => (
              <div
                key={index}
                className='mb-[10px] flex flex-col items-end last:mb-0'
              >
                <Form layout='vertical' className='w-full'>
                  <Row gutter={15}>
                    <Col span={12}>
                      <FormItem
                        label='学校名称'
                        labelClassName='text-[13px] text-white/85'
                        icon={
                          <School
                            theme='outline'
                            size='15'
                            fill={FORM_ICON_FILL}
                          />
                        }
                      >
                        <Input
                          maxLength={30}
                          value={item.school}
                          placeholder='请输入学校名称'
                          onChange={(e) => handleChange(e, index, 'school')}
                        />
                      </FormItem>
                    </Col>
                    <Col span={12}>
                      <FormItem
                        label='学位'
                        labelClassName='text-[13px] text-white/85'
                        icon={
                          <DegreeHat
                            theme='outline'
                            size='15'
                            fill={FORM_ICON_FILL}
                          />
                        }
                      >
                        <Select
                          options={degree}
                          value={item.degree}
                          onChange={(e) => handleChange(e, index, 'degree')}
                          placeholder='请选择学位'
                        />
                      </FormItem>
                    </Col>
                    <Col span={12}>
                      <FormItem
                        label='专业'
                        labelClassName='text-[13px] text-white/85'
                        icon={
                          <Bookmark
                            theme='outline'
                            size='15'
                            fill={FORM_ICON_FILL}
                          />
                        }
                      >
                        <Input
                          maxLength={30}
                          value={item.major}
                          placeholder='请输入专业'
                          onChange={(e) => handleChange(e, index, 'major')}
                        />
                      </FormItem>
                    </Col>
                    <Col span={12}>
                      <FormItem
                        label='所在城市'
                        labelClassName='text-[13px] text-white/85'
                        icon={
                          <City theme='outline' size='15' fill={FORM_ICON_FILL} />
                        }
                      >
                        <Cascader
                          options={city}
                          value={item.city}
                          onChange={(e) => handleChange(e, index, 'city')}
                          placeholder='请选择城市'
                        />
                      </FormItem>
                    </Col>
                    <Col span={24}>
                      <FormItem
                        label='学校类型'
                        labelClassName='text-[13px] text-white/85'
                        icon={
                          <Notes theme='outline' size='15' fill={FORM_ICON_FILL} />
                        }
                      >
                        <Select
                          options={schoolType}
                          value={item.tags}
                          onChange={(e) => handleChange(e, index, 'tags')}
                          placeholder='请选择学校类型'
                          mode='multiple'
                        />
                      </FormItem>
                    </Col>
                    <Col span={24}>
                      <FormItem
                        label='学院'
                        labelClassName='text-[13px] text-white/85'
                        icon={
                          <BuildingFour
                            theme='outline'
                            size='15'
                            fill={FORM_ICON_FILL}
                          />
                        }
                      >
                        <Input
                          maxLength={30}
                          value={item.academy}
                          placeholder='请输入学院'
                          onChange={(e) => handleChange(e, index, 'academy')}
                        />
                      </FormItem>
                    </Col>
                    <Col span={24}>
                      <FormItem
                        label='在读时间'
                        labelClassName='text-[13px] text-white/85'
                        icon={
                          <Calendar
                            theme='outline'
                            size='15'
                            fill={FORM_ICON_FILL}
                          />
                        }
                      >
                        <DatePicker.RangePicker
                          picker='month'
                          style={{ width: '100%' }}
                          value={[
                            item.startDate ? dayjs(item.startDate) : undefined,
                            item.endDate ? dayjs(item.endDate) : undefined,
                          ]}
                          format='YYYY-MM'
                          placeholder={['开始时间', '结束时间']}
                          onChange={(e) => handleChange(e, index, 'date')}
                        />
                      </FormItem>
                    </Col>
                    <Col span={24}>
                      <FormItem
                        label='在校经历'
                        labelClassName='text-[13px] text-white/85'
                        icon={
                          <EditOne
                            theme='outline'
                            size='15'
                            fill={FORM_ICON_FILL}
                          />
                        }
                      >
                        <div className='w-full'>
                          <RichTextEditor
                            instanceKey={`${moduleActive}-${index}`}
                            html={item.description ?? ''}
                            onHtmlChange={(next) =>
                              handleDescriptionHtml(index, next)
                            }
                            placeholder='请输入在校经历…'
                            onAiPolishClick={(richTextHtml, ctx) => {
                              const cityStr = Array.isArray(item.city)
                                ? item.city.join(' - ')
                                : String(item.city ?? '').trim();
                              const studyTime =
                                item.startDate && item.endDate
                                  ? `${item.startDate} ~ ${item.endDate}`
                                  : '';
                              const schoolTypeTags = Array.isArray(item.tags)
                                ? item.tags.join('、')
                                : '';
                              return polishEducationDescriptionWithBigmodel(
                                {
                                  richTextHtml,
                                  school: String(item.school ?? ''),
                                  degree: String(item.degree ?? ''),
                                  major: String(item.major ?? ''),
                                  city: cityStr,
                                  schoolTypeTags,
                                  academy: String(item.academy ?? ''),
                                  studyTime,
                                  intentPosts: intentPostsForPolish,
                                },
                                ctx?.onStreamingHtml
                              );
                            }}
                          />
                        </div>
                      </FormItem>
                    </Col>
                  </Row>
                </Form>
                <ButtonGroup
                  showUp={index !== 0}
                  showDown={index !== module.options.items.length - 1}
                  handleUp={() => handleUp(index)}
                  handleDown={() => handleDown(index)}
                  handleDelete={() => handleDelete(index)}
                  handleCopy={() => handleCopy(index)}
                />
                {index !== module.options.items.length - 1 && <SplitLine />}
              </div>
            ))
          ) : (
            <Empty description='暂无教育经历' />
          )}
        </div>
      ) : null}
    </div>
  );
}

export default memo(observer(Education));
