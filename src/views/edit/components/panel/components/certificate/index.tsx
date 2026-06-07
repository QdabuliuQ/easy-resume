'use client';
import FormItem from '@/components/formItem';
import { FileDoneOutlined } from '@ant-design/icons';
import { configStore, moduleActiveStore } from '@/mobx';
import { Col, Empty, Form, Input, Row } from 'antd';
import { useAppMessage } from '@/hooks/useAppMessage';
import { ResponsiveDatePicker } from '@/components/responsiveDatePicker';
import dayjs from 'dayjs';
import { observer } from 'mobx-react';
import { memo, useEffect, useId, useState, type CSSProperties } from 'react';
import { Calendar, Certificate as CertificateIcon } from '@icon-park/react';
import { useDebounceFn, useMemoizedFn } from 'ahooks';
import { useModuleHandle } from '@/hooks/module';
import AddGradientButton from '../addGradientButton';
import ButtonGroup from '../buttonGroup';
import PanelToolbar from '../panelToolbar';
import { CertificateProps } from '@/modules/certificate';
import ModulePanelTitleEdit from '../modulePanelTitleEdit';
import {
  canAddResumeModuleItem,
  resumeModuleItemLimitMessage,
} from '@/utils/moduleTypeLimits';
import { useTranslations } from 'next-intl';
import { ensureResumeModuleItemsId, makeResumeItemId } from '@/utils/createResumeModule';

const FORM_ICON_FILL = 'var(--panel-form-icon)';

function Certificate({ moduleId }: { moduleId?: string } = {}) {
  const message = useAppMessage();
  const tc = useTranslations('Edit.certificate');
  const { getModule, getModuleIndex } = useModuleHandle();
  const moduleActive = moduleId ?? moduleActiveStore.getModuleActive;
  const editOpen = moduleActiveStore.getModuleActive === moduleActive;
  const [module, setModule] = useState<CertificateProps | null>(null);
  const gradId = useId().replace(/:/g, '');
  const pid = useMemoizedFn((index: number, key: string) => `${moduleActive}_${index}_${key}`);

  useEffect(() => {
    const m = getModule(moduleActive);
    if (m) {
      setModule(ensureResumeModuleItemsId(JSON.parse(JSON.stringify(m)) as CertificateProps));
    } else {
      setModule(null);
    }
  }, [moduleActive, getModule]);

  const { run } = useDebounceFn(
    (mod: CertificateProps) => {
      const config = configStore.getConfig;
      if (!config) return;
      const res = getModuleIndex(moduleActive);
      if (!res) return;
      config.pages[res.page].modules[res.module] = mod;
      configStore.setConfig({
        ...config,
        pages: [...config.pages],
      });
    },
    { wait: 100 }
  );

  const updateModule = useMemoizedFn((mod: CertificateProps) => {
    const _module = JSON.parse(JSON.stringify(mod));
    setModule(_module);
    run(_module);
  });

  const addCertificate = useMemoizedFn(() => {
    if (!module) return;
    if (!canAddResumeModuleItem('certificate', module.options.items.length)) {
      message.warning(resumeModuleItemLimitMessage('certificate'));
      return;
    }
    module.options.items.unshift({
      id: makeResumeItemId(),
      name: tc('moduleName'),
      date: '2020-01-01',
    });
    updateModule(module);
  });

  const handleChange = useMemoizedFn(
    (index: number, key: string, value: any) => {
      if (!module) return;
      if (key === 'name') {
        module.options.items[index][key] = value.target.value;
      } else if (key === 'date') {
        module.options.items[index][key] = value.format('YYYY-MM-DD');
      }
      updateModule(module);
    }
  );

  const handleDelete = useMemoizedFn((index: number) => {
    if (!module) return;
    module.options.items.splice(index, 1);
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
    if (!canAddResumeModuleItem('certificate', module.options.items.length)) {
      message.warning(resumeModuleItemLimitMessage('certificate'));
      return;
    }
    const copy = JSON.parse(JSON.stringify(module.options.items[index]));
    copy.id = makeResumeItemId();
    module.options.items.splice(index, 0, copy);
    updateModule(module);
  });

  const iconGradId = `certificate-icon-grad-${gradId}`;
  const certificateItemsFull =
    module != null &&
    !canAddResumeModuleItem('certificate', module.options.items.length);

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
                <stop offset='0%' stopColor='var(--color-primary-gradient-start)' />
                <stop offset='100%' stopColor='var(--color-primary)' />
              </linearGradient>
            </defs>
          </svg>
          <div
            className='panel-module-icon text-base [&_.anticon_svg_path]:!fill-[var(--cert-icon-fill)]'
            style={
              {
                ['--cert-icon-fill']: `url(#${iconGradId})`,
              } as CSSProperties
            }
            aria-hidden
          >
            <FileDoneOutlined />
          </div>
          <ModulePanelTitleEdit
            resetKey={moduleActive}
            title={module?.options?.title ?? ''}
            fallbackTitle={tc('fallbackTitle')}
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
            <div className='text-[13px] text-fg/75'>{tc('emptyInline')}</div>
          ) : (
            <>
              <div className='flex max-h-[200px] flex-col gap-1.5 overflow-y-auto'>
                {module.options.items
                  .slice(0, 12)
                  .map((item: any, i: number) => (
                    <div
                      key={i}
                      className='break-all text-[13px] text-fg/75'
                    >
                      {item.name || '—'} · {item.date || '—'}
                    </div>
                  ))}
              </div>
              <div className='pt-2 text-[12px] text-fg/58'>
                {tc('itemCount', { n: module.options.items.length })}
                {module.options.items.length > 12 ? tc('previewCap') : ''}
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
          <AddGradientButton onClick={addCertificate} disabled={certificateItemsFull}>
            {tc('add')}
          </AddGradientButton>
          {module.options.items.length > 0 ? (
            <div className='mb-[10px] flex flex-col items-end'>
              {module.options.items.map((item: any, index: number) => (
                <div
                  key={index}
                  className='panel-item-shell flex w-full flex-col items-end'
                >
                  <Form layout='vertical' className='w-full'>
                    <Row gutter={15}>
                      <Col span={12}>
                        <FormItem
                          label={tc('name')}
                          labelClassName='text-[13px] text-fg/85'
                          icon={
                            <CertificateIcon
                              theme='outline'
                              size='15'
                              fill={FORM_ICON_FILL}
                            />
                          }
                        >
                          <Input
                            maxLength={30}
                            value={item.name}
                            data-panel-item-id={pid(index, 'name')}
                            placeholder={tc('namePh')}
                            onChange={(e) => handleChange(index, 'name', e)}
                          />
                        </FormItem>
                      </Col>
                      <Col span={12}>
                        <FormItem
                          label={tc('date')}
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
                            <ResponsiveDatePicker
                              style={{ width: '100%' }}
                              value={dayjs(item.date)}
                              placeholder={tc('datePh')}
                              onChange={(e) => handleChange(index, 'date', e)}
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
                    copyDisabled={certificateItemsFull}
                    flush
                  />
                  {/* 分割线已移除 */}
                </div>
              ))}
            </div>
          ) : (
            <Empty description={tc('empty')} className='mb-5' />
          )}
        </div>
      ) : null}
    </div>
  );
}

export default memo(observer(Certificate));
