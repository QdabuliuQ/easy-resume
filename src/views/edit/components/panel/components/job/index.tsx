import FormItem from '@/components/formItem';
import { useModuleHandle } from '@/hooks/module';
import { polishJobDescriptionWithBigmodel } from '@/api/jobDescriptionPolish';
import { configStore, moduleActiveStore } from '@/mobx';
import { city } from '@/modules/utils/constant';
import {
  Briefcase,
  BuildingThree,
  Calendar,
  HomeTwo,
  Notes,
  PullDoor,
} from '@icon-park/react';
import {
  Row,
  Col,
  Input,
  Form,
  Cascader,
  DatePicker,
  Empty,
} from 'antd';
import { observer } from 'mobx-react';
import {
  memo,
  useEffect,
  useId,
  useState,
  type CSSProperties,
} from 'react';
import { useDebounceFn, useMemoizedFn } from 'ahooks';
import AddGradientButton from '../addGradientButton';
import ButtonGroup from '../buttonGroup';
import { JobProps } from '@/modules/job';
import SplitLine from '../splitLine';
import ModulePanelTitleEdit from '../modulePanelTitleEdit';
import PanelToolbar from '../panelToolbar';
import dayjs from 'dayjs';
import { SolutionOutlined } from '@ant-design/icons';
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

function Job({ moduleId }: { moduleId?: string } = {}) {
  const { getModule, getModuleIndex } = useModuleHandle();
  const moduleActive = moduleId ?? moduleActiveStore.getModuleActive;
  const editOpen = moduleActiveStore.getModuleActive === moduleActive;
  const [module, setModule] = useState<JobProps | null>(null);
  const gradId = useId().replace(/:/g, '');
  const iconGradId = `job-icon-grad-${gradId}`;

  useEffect(() => {
    const m = getModule(moduleActive);
    if (m) {
      const cloned = JSON.parse(JSON.stringify(m)) as JobProps;
      cloned.options.items = cloned.options.items.map((item: any) => ({
        ...item,
        city:
          typeof item.city === 'string' && item.city
            ? item.city.split(' - ')
            : item.city || '',
      }));
      setModule(cloned);
    } else {
      setModule(null);
    }
  }, [moduleActive, getModule]);

  const { run } = useDebounceFn(
    (mod: JobProps) => {
      const config = configStore.getConfig;
      if (!config) return;
      const res = getModuleIndex(moduleActive);
      if (!res) return;
      const _module = JSON.parse(JSON.stringify(mod));
      _module.options.items = _module.options.items.map((item: any) => ({
        ...item,
        city: Array.isArray(item.city) ? item.city.join(' - ') : item.city,
      }));
      config.pages[res.page].modules[res.module] = _module;
      configStore.setConfig({
        ...config,
        pages: [...config.pages],
      });
    },
    { wait: 100 }
  );

  const updateModule = useMemoizedFn((module: JobProps) => {
    const _module = JSON.parse(JSON.stringify(module));
    setModule(_module);
    run(_module);
  });

  const handleChange = useMemoizedFn((e: any, index: number, key: string) => {
    if (!module) return;
    if (key === 'company' || key === 'post' || key === 'department') {
      module.options.items[index][key] = e.target.value;
    } else if (key === 'city') {
      module.options.items[index][key] = e.join(' - ');
    } else if (key === 'date') {
      module.options.items[index].startDate = e[0].format('YYYY-MM');
      module.options.items[index].endDate = e[1].format('YYYY-MM');
    }
    updateModule(module);
  });

  const handleDelete = useMemoizedFn((index: number) => {
    if (!module) return;
    module.options.items.splice(index, 1);
    updateModule(module);
  });

  const handleAdd = useMemoizedFn(() => {
    if (!module) return;
    module.options.items.unshift({
      company: '',
      post: '',
      department: '',
      city: '',
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
                <stop offset='0%' stopColor='#34d399' />
                <stop offset='100%' stopColor='#0d9488' />
              </linearGradient>
            </defs>
          </svg>
          <div
            className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-base [&_.anticon_svg_path]:!fill-[var(--job-icon-fill)]'
            style={
              {
                ['--job-icon-fill']: `url(#${iconGradId})`,
              } as CSSProperties
            }
            aria-hidden
          >
            <SolutionOutlined />
          </div>
          <ModulePanelTitleEdit
            resetKey={moduleActive}
            title={module?.options?.title ?? ''}
            fallbackTitle='工作经历'
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
            <div className='text-[13px] text-white/75'>暂无工作经历条目</div>
          ) : (
            <>
              <div className='flex max-h-[240px] flex-col gap-1.5 overflow-y-auto'>
                {module.options.items.slice(0, 10).map((item: any, i: number) => (
                  <div
                    key={i}
                    className='break-all text-[13px] text-white/75'
                  >
                    {item.company || '—'} · {item.post || '—'}{' '}
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
          <AddGradientButton onClick={handleAdd}>添加工作经历</AddGradientButton>
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
                        label='公司'
                        labelClassName='text-[13px] text-white/85'
                        icon={
                          <BuildingThree
                            theme='outline'
                            size='15'
                            fill={FORM_ICON_FILL}
                          />
                        }
                      >
                        <Input
                          maxLength={30}
                          value={item.company}
                          placeholder='请输入公司'
                          onChange={(e) => handleChange(e, index, 'company')}
                        />
                      </FormItem>
                    </Col>
                    <Col span={12}>
                      <FormItem
                        label='职位'
                        labelClassName='text-[13px] text-white/85'
                        icon={
                          <Briefcase
                            theme='outline'
                            size='15'
                            fill={FORM_ICON_FILL}
                          />
                        }
                      >
                        <Input
                          maxLength={30}
                          value={item.post}
                          placeholder='请输入职位'
                          onChange={(e) => handleChange(e, index, 'post')}
                        />
                      </FormItem>
                    </Col>
                    <Col span={12}>
                      <FormItem
                        label='部门'
                        labelClassName='text-[13px] text-white/85'
                        icon={
                          <PullDoor
                            theme='outline'
                            size='15'
                            fill={FORM_ICON_FILL}
                          />
                        }
                      >
                        <Input
                          maxLength={30}
                          value={item.department}
                          placeholder='请输入部门'
                          onChange={(e) => handleChange(e, index, 'department')}
                        />
                      </FormItem>
                    </Col>
                    <Col span={12}>
                      <FormItem
                        label='城市'
                        labelClassName='text-[13px] text-white/85'
                        icon={
                          <HomeTwo
                            theme='outline'
                            size='15'
                            fill={FORM_ICON_FILL}
                          />
                        }
                      >
                        <Cascader
                          value={item.city}
                          options={city}
                          placeholder='请选择城市'
                          onChange={(e) => handleChange(e, index, 'city')}
                        />
                      </FormItem>
                    </Col>
                    <Col span={24}>
                      <FormItem
                        label='在职时间'
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
                          placeholder={['开始时间', '结束时间']}
                          onChange={(e) => handleChange(e, index, 'date')}
                          format='YYYY-MM'
                        />
                      </FormItem>
                    </Col>
                    <Col span={24}>
                      <FormItem
                        label='工作内容'
                        labelClassName='text-[13px] text-white/85'
                        icon={
                          <Notes theme='outline' size='15' fill={FORM_ICON_FILL} />
                        }
                      >
                        <div className='w-full'>
                          <RichTextEditor
                            instanceKey={`${moduleActive}-${index}`}
                            html={item.description ?? ''}
                            onHtmlChange={(next) =>
                              handleDescriptionHtml(index, next)
                            }
                            placeholder='请输入工作内容…'
                            onAiPolishClick={(richTextHtml, ctx) => {
                              const cityStr = Array.isArray(item.city)
                                ? item.city.join(' - ')
                                : String(item.city ?? '').trim();
                              const timeStr =
                                item.startDate && item.endDate
                                  ? `${item.startDate} ~ ${item.endDate}`
                                  : '';
                              const postDept = [item.post, item.department]
                                .map((s: string) => String(s ?? '').trim())
                                .filter(Boolean)
                                .join(' / ');
                              return polishJobDescriptionWithBigmodel(
                                {
                                  richTextHtml,
                                  company: String(item.company ?? ''),
                                  time: timeStr,
                                  postDepartment: postDept,
                                  city: cityStr,
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
            <Empty description='暂无工作经历' className='mb-5' />
          )}
        </div>
      ) : null}
    </div>
  );
}

export default memo(observer(Job));
