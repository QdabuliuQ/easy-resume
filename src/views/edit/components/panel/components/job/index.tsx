'use client';
import FormItem from '@/components/formItem';
import { ResponsiveRangeDatePicker } from '@/components/responsiveDatePicker';
import { useModuleHandle } from '@/hooks/module';
import { polishDescription } from '@/api/polishDescription';
import { intentPostsFromResumeConfig } from '@/utils/intentPosts';
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
  Empty,
} from 'antd';
import { useAppMessage } from '@/hooks/useAppMessage';
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
import ModulePanelTitleEdit from '../modulePanelTitleEdit';
import PanelToolbar from '../panelToolbar';
import dayjs from 'dayjs';
import { SolutionOutlined } from '@ant-design/icons';
import RichTextEditor from '@/components/richTextEditor';
import {
  canAddResumeModuleItem,
  resumeModuleItemLimitMessage,
} from '@/utils/moduleTypeLimits';
import { ensureResumeModuleItemsId, makeResumeItemId } from '@/utils/createResumeModule';
import { useTranslations } from 'next-intl';

const FORM_ICON_FILL = 'var(--panel-form-icon)';

function Job({ moduleId }: { moduleId?: string } = {}) {
  const message = useAppMessage();
  const tj = useTranslations('Edit.job');
  const { getModule, getModuleIndex } = useModuleHandle();
  const config = configStore.getConfig;
  const moduleActive = moduleId ?? moduleActiveStore.getModuleActive;
  const editOpen = moduleActiveStore.getModuleActive === moduleActive;
  const [module, setModule] = useState<JobProps | null>(null);
  const gradId = useId().replace(/:/g, '');
  const iconGradId = `job-icon-grad-${gradId}`;
  const pid = useMemoizedFn((index: number, key: string) => `${moduleActive}_${index}_${key}`);

  useEffect(() => {
    const m = getModule(moduleActive);
    if (m) {
      const cloned = ensureResumeModuleItemsId(
        JSON.parse(JSON.stringify(m)) as JobProps,
      );
      cloned.options.items = cloned.options.items.map((item: any) => ({
        ...item,
        city:
          typeof item.city === 'string' && item.city
            ? item.city.split(' - ')
            : Array.isArray(item.city)
              ? item.city
              : [],
      }));
      setModule(cloned);
    } else {
      setModule(null);
    }
  }, [moduleActive, getModule, config]);

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
      module.options.items[index][key] = Array.isArray(e) ? e : [];
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
    if (!canAddResumeModuleItem('job', module.options.items.length)) {
      message.warning(resumeModuleItemLimitMessage('job'));
      return;
    }
    module.options.items.unshift({
      id: makeResumeItemId(),
      company: '',
      post: '',
      department: '',
      city: [],
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
    if (!canAddResumeModuleItem('job', module.options.items.length)) {
      message.warning(resumeModuleItemLimitMessage('job'));
      return;
    }
    const copy = JSON.parse(JSON.stringify(module.options.items[index]));
    copy.id = makeResumeItemId();
    module.options.items.splice(index, 0, copy);
    updateModule(module);
  });

  const handleDescriptionHtml = useMemoizedFn((index: number, html: string) => {
    if (!module) return;
    module.options.items[index].description = html;
    updateModule(module);
  });

  const intentPostsForPolish = intentPostsFromResumeConfig(configStore.getConfig);
  const jobItemsFull =
    module != null &&
    !canAddResumeModuleItem('job', module.options.items.length);

  return (
    <div className='[&_.ant-form-item]:!mb-2.5'>
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
            className='panel-module-icon text-base [&_.anticon_svg_path]:!fill-[var(--job-icon-fill)]'
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
            fallbackTitle={tj('fallbackTitle')}
            panelItemId={`${moduleActive}_title`}
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
          className='panel-module-preview info1-panel-animate text-fg/95'
        >
          {module.options.items.length === 0 ? (
            <div className='text-[13px] text-fg/75'>{tj('emptyInline')}</div>
          ) : (
            <>
              <div className='flex max-h-[240px] flex-col gap-1.5 overflow-y-auto'>
                {module.options.items.slice(0, 10).map((item: any, i: number) => (
                  <div
                    key={i}
                    className='break-all text-[13px] text-fg/75'
                  >
                    {item.company || '—'} · {item.post || '—'}{' '}
                    {item.startDate && item.endDate
                      ? `${item.startDate} ~ ${item.endDate}`
                      : '—'}
                  </div>
                ))}
              </div>
              <div className='pt-2 text-[12px] text-fg/58'>
                {tj('itemCount', { n: module.options.items.length })}
                {module.options.items.length > 10 ? tj('previewCap') : ''}
              </div>
            </>
          )}
        </div>
      )}

      {editOpen && module ? (
        <div
          key='edit'
          className='panel-module-edit info1-panel-animate text-fg/95'
        >
          <AddGradientButton onClick={handleAdd} disabled={jobItemsFull}>
            {tj('add')}
          </AddGradientButton>
          {module.options.items.length > 0 ? (
            module.options.items.map((item: any, index: number) => (
              <div
                key={index}
                className='panel-item-shell flex flex-col items-end'
              >
                <Form layout='vertical' className='w-full'>
                  <Row gutter={15}>
                    <Col span={12}>
                      <FormItem
                        label={tj('company')}
                        labelClassName='text-[13px] text-fg/85'
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
                          data-panel-item-id={pid(index, 'company')}
                          placeholder={tj('companyPh')}
                          onChange={(e) => handleChange(e, index, 'company')}
                        />
                      </FormItem>
                    </Col>
                    <Col span={12}>
                      <FormItem
                        label={tj('role')}
                        labelClassName='text-[13px] text-fg/85'
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
                          data-panel-item-id={pid(index, 'post')}
                          placeholder={tj('rolePh')}
                          onChange={(e) => handleChange(e, index, 'post')}
                        />
                      </FormItem>
                    </Col>
                    <Col span={12}>
                      <FormItem
                        label={tj('dept')}
                        labelClassName='text-[13px] text-fg/85'
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
                          data-panel-item-id={pid(index, 'department')}
                          placeholder={tj('deptPh')}
                          onChange={(e) => handleChange(e, index, 'department')}
                        />
                      </FormItem>
                    </Col>
                    <Col span={12}>
                      <FormItem
                        label={tj('city')}
                        labelClassName='text-[13px] text-fg/85'
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
                          data-panel-item-id={pid(index, 'city')}
                          placeholder={tj('cityPh')}
                          onChange={(e) => handleChange(e, index, 'city')}
                        />
                      </FormItem>
                    </Col>
                    <Col span={24}>
                      <FormItem
                        label={tj('period')}
                        labelClassName='text-[13px] text-fg/85'
                        icon={
                          <Calendar
                            theme='outline'
                            size='15'
                            fill={FORM_ICON_FILL}
                          />
                        }
                      >
                        <div data-panel-item-id={pid(index, 'date')}>
                          <ResponsiveRangeDatePicker
                            style={{ width: '100%' }}
                            value={[
                              item.startDate ? dayjs(item.startDate) : undefined,
                              item.endDate ? dayjs(item.endDate) : undefined,
                            ]}
                            placeholder={[tj('periodPhStart'), tj('periodPhEnd')]}
                            onChange={(e) => handleChange(e, index, 'date')}
                            format='YYYY-MM'
                          />
                        </div>
                      </FormItem>
                    </Col>
                    <Col span={24}>
                      <FormItem
                        label={tj('content')}
                        labelClassName='text-[13px] text-fg/85'
                        icon={
                          <Notes theme='outline' size='15' fill={FORM_ICON_FILL} />
                        }
                      >
                        <div className='w-full'>
                          <RichTextEditor
                            instanceKey={`${moduleActive}-${index}`}
                            html={item.description ?? ''}
                            dataPanelItemId={pid(index, 'description')}
                            onHtmlChange={(next) =>
                              handleDescriptionHtml(index, next)
                            }
                            placeholder={tj('contentPh')}
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
                              return polishDescription(
                                {
                                  type: 'job',
                                  richTextHtml,
                                  intentPosts: intentPostsForPolish,
                                  context: {
                                    company: String(item.company ?? ''),
                                    time: timeStr,
                                    postDepartment: postDept,
                                    city: cityStr,
                                  },
                                },
                                ctx?.onStreamingHtml,
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
                  copyDisabled={jobItemsFull}
                  flush
                />
                
              </div>
            ))
          ) : (
            <Empty description={tj('empty')} className='mb-5' />
          )}
        </div>
      ) : null}
    </div>
  );
}

export default memo(observer(Job));
