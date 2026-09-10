'use client';
import FormItem from '@/components/formItem';
import { ResponsiveRangeDatePicker } from '@/components/responsiveDatePicker';
import { resumeRangeEndDateString } from '@/utils/resumeDateDisplay';
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
import SolutionOutlined from '@ant-design/icons/SolutionOutlined';
import RichTextEditor from '@/components/richTextEditor/lazy';
import {
  canAddResumeModuleItem,
  resumeModuleItemLimitMessage,
} from '@/utils/moduleTypeLimits';
import { ensureResumeModuleItemsId, makeResumeItemId } from '@/utils/createResumeModule';
import { useTranslations } from 'next-intl';
import { clonePlain } from '@/utils/clonePlain';

const FORM_ICON_FILL = 'var(--panel-form-icon)';

function Job({ moduleId }: { moduleId?: string } = {}) {
  const message = useAppMessage();
  const tj = useTranslations('Edit.job');
  const { getModule } = useModuleHandle();
  const config = configStore.getConfig;
  const moduleActive = moduleId ?? moduleActiveStore.getModuleActive;
  const editOpen = moduleActiveStore.getModuleActive === moduleActive;
  const [module, setModule] = useState<JobProps | null>(null);
  const gradId = useId().replace(/:/g, '');
  const iconGradId = `job-icon-grad-${gradId}`;
  const pid = useMemoizedFn((itemId: string, key: string) => `${moduleActive}_${itemId}_${key}`);

  useEffect(() => {
    const m = getModule(moduleActive);
    if (m) {
      const cloned = ensureResumeModuleItemsId(clonePlain(m) as JobProps);
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
    (targetModuleId: string, mod: JobProps) => {
      const items = mod.options.items.map((item: any) => ({
        ...item,
        city: Array.isArray(item.city) ? item.city.join(' - ') : item.city,
      }));
      configStore.updateModuleField(targetModuleId, 'items', items);
    },
    { wait: 200 }
  );

  const commitModule = useMemoizedFn((next: JobProps) => {
    setModule(next);
    run(moduleActive, next);
  });

  const commitItems = useMemoizedFn((items: JobProps['options']['items']) => {
    if (!module) return;
    commitModule({ ...module, options: { ...module.options, items } });
  });

  const handleChange = useMemoizedFn((e: any, index: number, key: string) => {
    if (!module) return;
    let patch: Record<string, unknown> = {};
    if (key === 'company' || key === 'post' || key === 'department') {
      patch = { [key]: e.target.value };
    } else if (key === 'city') {
      patch = { city: Array.isArray(e) ? e : [] };
    } else if (key === 'date') {
      const payload = e as {
        dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null;
        endIsPresent: boolean;
      };
      patch = {
        startDate: payload.dates?.[0]?.format('YYYY-MM') ?? '',
        endDate: resumeRangeEndDateString(
          payload.dates?.[1],
          payload.endIsPresent,
        ),
      };
    }
    commitItems(
      module.options.items.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    );
  });

  const handleDelete = useMemoizedFn((index: number) => {
    if (!module) return;
    commitItems(module.options.items.filter((_, i) => i !== index));
  });

  const handleAdd = useMemoizedFn(() => {
    if (!module) return;
    if (!canAddResumeModuleItem('job', module.options.items.length)) {
      message.warning(resumeModuleItemLimitMessage('job'));
      return;
    }
    commitItems([
      {
        id: makeResumeItemId(),
        company: '',
        post: '',
        department: '',
        city: [],
        startDate: undefined as any,
        endDate: undefined as any,
        description: '',
      },
      ...module.options.items,
    ]);
  });

  const handleUp = useMemoizedFn((index: number) => {
    if (!module || index <= 0) return;
    const items = module.options.items.slice();
    [items[index - 1], items[index]] = [items[index], items[index - 1]];
    commitItems(items);
  });

  const handleDown = useMemoizedFn((index: number) => {
    if (!module || index >= module.options.items.length - 1) return;
    const items = module.options.items.slice();
    [items[index], items[index + 1]] = [items[index + 1], items[index]];
    commitItems(items);
  });

  const handleCopy = useMemoizedFn((index: number) => {
    if (!module) return;
    if (!canAddResumeModuleItem('job', module.options.items.length)) {
      message.warning(resumeModuleItemLimitMessage('job'));
      return;
    }
    const copy = { ...clonePlain(module.options.items[index]), id: makeResumeItemId() };
    const items = module.options.items.slice();
    items.splice(index, 0, copy);
    commitItems(items);
  });

  const handleDescriptionHtml = useMemoizedFn((index: number, html: string) => {
    if (!module) return;
    commitItems(
      module.options.items.map((item, i) =>
        i === index ? { ...item, description: html } : item,
      ),
    );
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
              commitModule({
                ...module,
                options: { ...module.options, title: next },
              });
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
                {module.options.items.slice(0, 10).map((item: any) => (
                  <div
                    key={item.id}
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
          className='info1-panel-animate text-fg/95'
        >
          <AddGradientButton onClick={handleAdd} disabled={jobItemsFull}>
            {tj('add')}
          </AddGradientButton>
          {module.options.items.length > 0 ? (
            module.options.items.map((item: any, index: number) => (
              <div
                key={item.id}
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
                          data-panel-item-id={pid(item.id, 'company')}
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
                          data-panel-item-id={pid(item.id, 'post')}
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
                          data-panel-item-id={pid(item.id, 'department')}
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
                          data-panel-item-id={pid(item.id, 'city')}
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
                        <div data-panel-item-id={pid(item.id, 'date')}>
                          <ResponsiveRangeDatePicker
                            style={{ width: '100%' }}
                            startDate={item.startDate}
                            endDate={item.endDate}
                            placeholder={[tj('periodPhStart'), tj('periodPhEnd')]}
                            onChange={(dates, meta) =>
                              handleChange({ dates, endIsPresent: meta.endIsPresent }, index, 'date')
                            }
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
                            instanceKey={`${moduleActive}-${item.id}`}
                            html={item.description ?? ''}
                            dataPanelItemId={pid(item.id, 'description')}
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
                                ctx?.signal,
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
