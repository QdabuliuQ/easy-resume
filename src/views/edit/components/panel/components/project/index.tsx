'use client';
import FormItem from '@/components/formItem';
import { useModuleHandle } from '@/hooks/module';
import { configStore, moduleActiveStore } from '@/mobx';
import { polishDescription } from '@/api/polishDescription';
import { intentPostsFromResumeConfig } from '@/utils/intentPosts';
import { ProjectProps } from '@/modules/project';
import { Book, Avatar, Calendar, EditOne } from '@icon-park/react';
import { ProjectOutlined } from '@ant-design/icons';
import { useDebounceFn, useMemoizedFn } from 'ahooks';
import { Col, Empty, Form, Input, Row } from 'antd';
import { useAppMessage } from '@/hooks/useAppMessage';
import { ResponsiveRangeDatePicker } from '@/components/responsiveDatePicker';
import { resumeRangeEndDateString } from '@/utils/resumeDateDisplay';
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
import ModulePanelTitleEdit from '../modulePanelTitleEdit';
import PanelToolbar from '../panelToolbar';
import RichTextEditor from '@/components/richTextEditor/lazy';
import ResumeQuillHtml from '@/components/resumeQuillHtml';
import {
  canAddResumeModuleItem,
  resumeModuleItemLimitMessage,
} from '@/utils/moduleTypeLimits';
import { useTranslations } from 'next-intl';
import { ensureResumeModuleItemsId, makeResumeItemId } from '@/utils/createResumeModule';

const FORM_ICON_FILL = 'var(--panel-form-icon)';

function hasRichPreview(html?: string): boolean {
  if (!html?.trim()) return false;
  const t = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, '').trim();
  return t.length > 0;
}

const PREVIEW_HTML_CLASS =
  'break-words text-[12px] text-fg/60';

function Project({ moduleId }: { moduleId?: string } = {}) {
  const message = useAppMessage();
  const tp = useTranslations('Edit.project');
  const { getModule, getModuleIndex } = useModuleHandle();
  const config = configStore.getConfig;
  const moduleActive = moduleId ?? moduleActiveStore.getModuleActive;
  const editOpen = moduleActiveStore.getModuleActive === moduleActive;
  const [module, setModule] = useState<ProjectProps | null>(null);
  const gradId = useId().replace(/:/g, '');
  const iconGradId = `project-icon-grad-${gradId}`;
  const pid = useMemoizedFn((index: number, key: string) => `${moduleActive}_${index}_${key}`);

  useEffect(() => {
    const m = getModule(moduleActive);
    if (m) {
      setModule(ensureResumeModuleItemsId(JSON.parse(JSON.stringify(m)) as ProjectProps));
    } else {
      setModule(null);
    }
  }, [moduleActive, getModule, config]);

  const { run } = useDebounceFn(
    (module: ProjectProps) => {
      const res = getModuleIndex(moduleActive);
      if (!res) return;
      const config = JSON.parse(JSON.stringify(configStore.getConfig));
      if (!config) return;
      const _module = JSON.parse(JSON.stringify(module));
      config.pages[res.page].modules[res.module] = _module;
      configStore.setConfig({
        ...config,
        pages: [...config.pages],
      });
    },
    { wait: 100 }
  );

  const handleAdd = useMemoizedFn(() => {
    if (!module) return;
    if (!canAddResumeModuleItem('project', module.options.items.length)) {
      message.warning(resumeModuleItemLimitMessage('project'));
      return;
    }
    module.options.items.unshift({
      id: makeResumeItemId(),
      name: '',
      role: '',
      startDate: undefined as any,
      endDate: undefined as any,
      description: '',
    });
    updateModule(module);
  });

  const updateModule = useMemoizedFn((module: ProjectProps) => {
    const _module = JSON.parse(JSON.stringify(module));
    setModule(_module);
    run(_module);
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
    if (!canAddResumeModuleItem('project', module.options.items.length)) {
      message.warning(resumeModuleItemLimitMessage('project'));
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

  type ChangeEvent = React.ChangeEvent<HTMLInputElement>;
  type RangeDatePayload = {
    dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null;
    endIsPresent: boolean;
  };
  const handleChange = useMemoizedFn((e: ChangeEvent | RangeDatePayload, index: number, key: string) => {
    if (!module) return;
    if (key === 'name' || key === 'role') {
      const event = e as ChangeEvent;
      module.options.items[index][key] = event.target.value;
    } else if (key === 'date') {
      const payload = e as RangeDatePayload;
      module.options.items[index].startDate = payload.dates?.[0]?.format('YYYY-MM') ?? '';
      module.options.items[index].endDate = resumeRangeEndDateString(
        payload.dates?.[1],
        payload.endIsPresent,
      );
    }
    updateModule(module);
  });

  const intentPostsForPolish = intentPostsFromResumeConfig(configStore.getConfig);
  const projectItemsFull =
    module != null &&
    !canAddResumeModuleItem('project', module.options.items.length);

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
                <stop offset='0%' stopColor='#f472b6' />
                <stop offset='100%' stopColor='#a855f7' />
              </linearGradient>
            </defs>
          </svg>
          <div
            className='panel-module-icon text-base [&_.anticon_svg_path]:!fill-[var(--proj-icon-fill)]'
            style={
              {
                ['--proj-icon-fill']: `url(#${iconGradId})`,
              } as CSSProperties
            }
            aria-hidden
          >
            <ProjectOutlined />
          </div>
          <ModulePanelTitleEdit
            resetKey={moduleActive}
            title={module?.options?.title ?? ''}
            fallbackTitle={tp('fallbackTitle')}
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
            <div className='text-[13px] text-fg/75'>{tp('emptyInline')}</div>
          ) : (
            <>
              <div className='flex max-h-[280px] flex-col gap-1.5 overflow-y-auto'>
                {module.options.items.slice(0, 10).map((item: any, i: number) => (
                  <div key={i} className='break-all text-[13px] text-fg/75'>
                    <div>
                      {item.name || '—'} · {item.role || '—'}{' '}
                      {item.startDate && item.endDate
                        ? `${item.startDate} ~ ${item.endDate}`
                        : '—'}
                    </div>
                    {hasRichPreview(item.description) ? (
                      <ResumeQuillHtml
                        html={item.description as string}
                        className={PREVIEW_HTML_CLASS}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
              <div className='pt-2 text-[12px] text-fg/58'>
                {tp('itemCount', { n: module.options.items.length })}
                {module.options.items.length > 10 ? tp('previewCap') : ''}
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
          <AddGradientButton onClick={handleAdd} disabled={projectItemsFull}>
            {tp('add')}
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
                        label={tp('name')}
                        labelClassName='text-[13px] text-fg/85'
                        icon={
                          <Book theme='outline' size='15' fill={FORM_ICON_FILL} />
                        }
                      >
                        <Input
                          maxLength={30}
                          value={item.name}
                          data-panel-item-id={pid(index, 'name')}
                          placeholder={tp('namePh')}
                          onChange={(e) => handleChange(e, index, 'name')}
                        />
                      </FormItem>
                    </Col>
                    <Col span={12}>
                      <FormItem
                        label={tp('role')}
                        labelClassName='text-[13px] text-fg/85'
                        icon={
                          <Avatar
                            theme='outline'
                            size='15'
                            fill={FORM_ICON_FILL}
                          />
                        }
                      >
                        <Input
                          maxLength={30}
                          value={item.role}
                          data-panel-item-id={pid(index, 'role')}
                          placeholder={tp('rolePh')}
                          onChange={(e) => handleChange(e, index, 'role')}
                        />
                      </FormItem>
                    </Col>
                    <Col span={24}>
                      <FormItem
                        label={tp('period')}
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
                            startDate={item.startDate}
                            endDate={item.endDate}
                            format='YYYY-MM'
                            placeholder={[tp('periodPhStart'), tp('periodPhEnd')]}
                            onChange={(dates, meta) =>
                              handleChange({ dates, endIsPresent: meta.endIsPresent }, index, 'date')
                            }
                          />
                        </div>
                      </FormItem>
                    </Col>
                    <Col span={24}>
                      <FormItem
                        label={tp('desc')}
                        labelClassName='text-[13px] text-fg/85'
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
                            dataPanelItemId={pid(index, 'description')}
                            onHtmlChange={(next) =>
                              handleDescriptionHtml(index, next)
                            }
                            placeholder={tp('descPh')}
                            onAiPolishClick={(richTextHtml, ctx) =>
                              polishDescription(
                                {
                                  type: 'project',
                                  richTextHtml,
                                  intentPosts: intentPostsForPolish,
                                  context: {
                                    projectName: String(item.name ?? ''),
                                    role: String(item.role ?? ''),
                                  },
                                },
                                ctx?.onStreamingHtml,
                                ctx?.signal,
                              )
                            }
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
                  copyDisabled={projectItemsFull}
                  flush
                />
                {/* 分割线已移除 */}
              </div>
            ))
          ) : (
            <Empty description={tp('empty')} />
          )}
        </div>
      ) : null}
    </div>
  );
}

export default memo(observer(Project));
