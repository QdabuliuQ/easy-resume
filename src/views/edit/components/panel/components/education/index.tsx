'use client';
import FormItem from '@/components/formItem';
import ResponsiveSelect from '@/components/responsiveSelect';
import { ResponsiveRangeDatePicker } from '@/components/responsiveDatePicker';
import { resumeRangeEndDateString } from '@/utils/resumeDateDisplay';
import { polishDescription } from '@/api/polishDescription';
import { intentPostsFromResumeConfig } from '@/utils/intentPosts';
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
import ReadOutlined from '@ant-design/icons/ReadOutlined';
import { useDebounceFn, useMemoizedFn } from 'ahooks';
import {
  Cascader,
  Col,
  Empty,
  Form,
  Input,
  Row,
} from 'antd';
import { useAppMessage } from '@/hooks/useAppMessage';
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
import ModulePanelTitleEdit from '../modulePanelTitleEdit';
import PanelToolbar from '../panelToolbar';
import RichTextEditor from '@/components/richTextEditor/lazy';
import {
  canAddResumeModuleItem,
  resumeModuleItemLimitMessage,
} from '@/utils/moduleTypeLimits';
import { useTranslations } from 'next-intl';
import { ensureResumeModuleItemsId, makeResumeItemId } from '@/utils/createResumeModule';
import { clonePlain } from '@/utils/clonePlain';

const FORM_ICON_FILL = 'var(--panel-form-icon)';

function Education({ moduleId }: { moduleId?: string } = {}) {
  const message = useAppMessage();
  const te = useTranslations('Edit.education');
  const { getModule } = useModuleHandle();
  const config = configStore.getConfig;
  const moduleActive = moduleId ?? moduleActiveStore.getModuleActive;
  const editOpen = moduleActiveStore.getModuleActive === moduleActive;
  const [module, setModule] = useState<EducationProps | null>(null);
  const gradId = useId().replace(/:/g, '');
  const iconGradId = `education-icon-grad-${gradId}`;
  const pid = useMemoizedFn((itemId: string, key: string) => `${moduleActive}_${itemId}_${key}`);

  useEffect(() => {
    const m = getModule(moduleActive);
    if (m) {
      const cloned = ensureResumeModuleItemsId(clonePlain(m) as EducationProps);
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
    (targetModuleId: string, mod: EducationProps) => {
      const items = mod.options.items.map((item: any) => ({
        ...item,
        city: Array.isArray(item.city) ? item.city.join(' - ') : item.city,
      }));
      configStore.updateModuleField(targetModuleId, 'items', items);
    },
    { wait: 200 }
  );

  const commitModule = useMemoizedFn((next: EducationProps) => {
    setModule(next);
    run(moduleActive, next);
  });

  const commitItems = useMemoizedFn((items: EducationProps['options']['items']) => {
    if (!module) return;
    commitModule({ ...module, options: { ...module.options, items } });
  });

  const handleAdd = useMemoizedFn(() => {
    if (!module) return;
    if (!canAddResumeModuleItem('education', module.options.items.length)) {
      message.warning(resumeModuleItemLimitMessage('education'));
      return;
    }
    commitItems([
      {
        id: makeResumeItemId(),
        school: '',
        degree: undefined as any,
        major: '',
        city: [],
        tags: [],
        academy: '',
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

  const handleDelete = useMemoizedFn((index: number) => {
    if (!module) return;
    commitItems(module.options.items.filter((_, i) => i !== index));
  });

  const handleCopy = useMemoizedFn((index: number) => {
    if (!module) return;
    if (!canAddResumeModuleItem('education', module.options.items.length)) {
      message.warning(resumeModuleItemLimitMessage('education'));
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
  const educationItemsFull =
    module != null &&
    !canAddResumeModuleItem('education', module.options.items.length);

  const handleChange = useMemoizedFn((e: any, index: number, key: string) => {
    if (!module) return;
    let patch: Record<string, unknown> = {};
    if (
      key === 'school' ||
      key === 'major' ||
      key === 'academy'
    ) {
      patch = { [key]: e.target.value };
    } else if (key === 'degree' || key === 'tags') {
      patch = { [key]: e };
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
    } else if (key === 'city') {
      patch = { city: Array.isArray(e) ? e : [] };
    }
    commitItems(
      module.options.items.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    );
  });

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
                <stop offset='0%' stopColor='#93c5fd' />
                <stop offset='100%' stopColor='#6366f1' />
              </linearGradient>
            </defs>
          </svg>
          <div
            className='panel-module-icon text-base [&_.anticon_svg_path]:!fill-[var(--edu-icon-fill)]'
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
            fallbackTitle={te('fallbackTitle')}
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
            <div className='text-[13px] text-fg/75'>{te('emptyInline')}</div>
          ) : (
            <>
              <div className='flex max-h-[240px] flex-col gap-1.5 overflow-y-auto'>
                {module.options.items.slice(0, 10).map((item: any) => (
                  <div
                    key={item.id}
                    className='break-all text-[13px] text-fg/75'
                  >
                    {item.school || '—'} · {item.major || '—'}{' '}
                    {item.startDate && item.endDate
                      ? `${item.startDate} ~ ${item.endDate}`
                      : '—'}
                  </div>
                ))}
              </div>
              <div className='pt-2 text-[12px] text-fg/58'>
                {te('itemCount', { n: module.options.items.length })}
                {module.options.items.length > 10 ? te('previewCap') : ''}
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
          <AddGradientButton onClick={handleAdd} disabled={educationItemsFull}>
            {te('add')}
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
                        label={te('school')}
                        labelClassName='text-[13px] text-fg/85'
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
                          data-panel-item-id={pid(item.id, 'school')}
                          placeholder={te('schoolPh')}
                          onChange={(e) => handleChange(e, index, 'school')}
                        />
                      </FormItem>
                    </Col>
                    <Col span={12}>
                      <FormItem
                        label={te('degree')}
                        labelClassName='text-[13px] text-fg/85'
                        icon={
                          <DegreeHat
                            theme='outline'
                            size='15'
                            fill={FORM_ICON_FILL}
                          />
                        }
                      >
                        <div data-panel-item-id={pid(item.id, 'degree')}>
                          <ResponsiveSelect
                            options={degree}
                            value={item.degree}
                            onChange={(e) => handleChange(e, index, 'degree')}
                            placeholder={te('degreePh')}
                          />
                        </div>
                      </FormItem>
                    </Col>
                    <Col span={12}>
                      <FormItem
                        label={te('major')}
                        labelClassName='text-[13px] text-fg/85'
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
                          data-panel-item-id={pid(item.id, 'major')}
                          placeholder={te('majorPh')}
                          onChange={(e) => handleChange(e, index, 'major')}
                        />
                      </FormItem>
                    </Col>
                    <Col span={12}>
                      <FormItem
                        label={te('city')}
                        labelClassName='text-[13px] text-fg/85'
                        icon={
                          <City theme='outline' size='15' fill={FORM_ICON_FILL} />
                        }
                      >
                        <Cascader
                          options={city}
                          value={item.city}
                          data-panel-item-id={pid(item.id, 'city')}
                          onChange={(e) => handleChange(e, index, 'city')}
                          placeholder={te('cityPh')}
                        />
                      </FormItem>
                    </Col>
                    <Col span={24}>
                      <FormItem
                        label={te('schoolType')}
                        labelClassName='text-[13px] text-fg/85'
                        icon={
                          <Notes theme='outline' size='15' fill={FORM_ICON_FILL} />
                        }
                      >
                        <div data-panel-item-id={pid(item.id, 'tags')}>
                          <ResponsiveSelect
                            options={schoolType}
                            value={item.tags}
                            onChange={(e) => handleChange(e, index, 'tags')}
                            placeholder={te('schoolTypePh')}
                            mode='multiple'
                          />
                        </div>
                      </FormItem>
                    </Col>
                    <Col span={24}>
                      <FormItem
                        label={te('college')}
                        labelClassName='text-[13px] text-fg/85'
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
                          data-panel-item-id={pid(item.id, 'academy')}
                          placeholder={te('collegePh')}
                          onChange={(e) => handleChange(e, index, 'academy')}
                        />
                      </FormItem>
                    </Col>
                    <Col span={24}>
                      <FormItem
                        label={te('period')}
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
                            format='YYYY-MM'
                            placeholder={[te('periodPhStart'), te('periodPhEnd')]}
                            onChange={(dates, meta) =>
                              handleChange({ dates, endIsPresent: meta.endIsPresent }, index, 'date')
                            }
                          />
                        </div>
                      </FormItem>
                    </Col>
                    <Col span={24}>
                      <FormItem
                        label={te('experience')}
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
                            instanceKey={`${moduleActive}-${item.id}`}
                            html={item.description ?? ''}
                            dataPanelItemId={pid(item.id, 'description')}
                            onHtmlChange={(next) =>
                              handleDescriptionHtml(index, next)
                            }
                            placeholder={te('experiencePh')}
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
                              return polishDescription(
                                {
                                  type: 'education',
                                  richTextHtml,
                                  intentPosts: intentPostsForPolish,
                                  context: {
                                    school: String(item.school ?? ''),
                                    degree: String(item.degree ?? ''),
                                    major: String(item.major ?? ''),
                                    city: cityStr,
                                    schoolTypeTags,
                                    academy: String(item.academy ?? ''),
                                    studyTime,
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
                  copyDisabled={educationItemsFull}
                  flush
                />
                {/* 分割线已移除 */}
              </div>
            ))
          ) : (
            <Empty description={te('empty')} />
          )}
        </div>
      ) : null}
    </div>
  );
}

export default memo(observer(Education));
