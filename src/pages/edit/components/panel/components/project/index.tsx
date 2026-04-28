import FormItem from '@/components/formItem';
import { useModuleHandle } from '@/hooks/module';
import { configStore, moduleActiveStore } from '@/mobx';
import { ProjectProps } from '@/modules/project';
import { Book, Avatar, Calendar, EditOne } from '@icon-park/react';
import { ProjectOutlined } from '@ant-design/icons';
import { useDebounceFn, useMemoizedFn } from 'ahooks';
import { Col, DatePicker, Empty, Form, Input, Row } from 'antd';
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
import SplitLine from '../splitLine';
import PanelToolbar from '../panelToolbar';

const FORM_ICON_FILL = 'rgba(255, 255, 255, 0.7)';

function Project({ moduleId }: { moduleId?: string } = {}) {
  const { getModule, getModuleIndex } = useModuleHandle();
  const moduleActive = moduleId ?? moduleActiveStore.getModuleActive;
  const [editOpen, setEditOpen] = useState(false);
  const [module, setModule] = useState<ProjectProps | null>(null);
  const gradId = useId().replace(/:/g, '');
  const iconGradId = `project-icon-grad-${gradId}`;

  useEffect(() => {
    const m = getModule(moduleActive);
    if (m) {
      setModule(JSON.parse(JSON.stringify(m)));
    } else {
      setModule(null);
    }
  }, [moduleActive, configStore.getConfig]);

  const { run } = useDebounceFn(
    (module: ProjectProps) => {
      const config = configStore.getConfig;
      if (!config) return;
      const res = getModuleIndex(moduleActive);
      if (!res) return;
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
    module.options.items.unshift({
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
    module.options.items.splice(
      index,
      0,
      JSON.parse(JSON.stringify(module.options.items[index]))
    );
    updateModule(module);
  });

  const handleChange = useMemoizedFn((e: any, index: number, key: string) => {
    if (!module) return;
    if (key === 'name' || key === 'role' || key === 'description') {
      module.options.items[index][key] = e.target.value;
    } else if (key === 'date') {
      module.options.items[index].startDate = e[0].format('YYYY-MM');
      module.options.items[index].endDate = e[1].format('YYYY-MM');
    }
    updateModule(module);
  });

  return (
    <div className='[&_.ant-form-item]:!mb-2.5'>
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
            className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-base [&_.anticon_svg_path]:!fill-[var(--proj-icon-fill)]'
            style={
              {
                ['--proj-icon-fill']: `url(#${iconGradId})`,
              } as CSSProperties
            }
            aria-hidden
          >
            <ProjectOutlined />
          </div>
          <span className='ml-[10px] text-[15px] font-medium text-white/95'>
            项目经历
          </span>
        </div>
        <PanelToolbar
          moduleId={moduleActive}
          editOpen={editOpen}
          setEditOpen={setEditOpen}
        />
      </div>

      {!editOpen && module && (
        <div
          key='preview'
          className='info1-panel-animate rounded-lg border border-white/[0.08] bg-white/[0.06] px-3.5 py-3 text-white/95'
        >
          <div className='mb-2 text-[15px] font-medium'>
            {module.options.title || '项目经历'}
          </div>
          {module.options.items.length === 0 ? (
            <div className='text-[13px] text-white/75'>暂无项目经历条目</div>
          ) : (
            <>
              <div className='flex max-h-[240px] flex-col gap-1.5 overflow-y-auto'>
                {module.options.items.slice(0, 10).map((item: any, i: number) => (
                  <div
                    key={i}
                    className='break-all text-[13px] text-white/75'
                  >
                    {item.name || '—'} · {item.role || '—'}{' '}
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
          <AddGradientButton onClick={handleAdd}>添加项目经历</AddGradientButton>
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
                        label='项目名称'
                        labelClassName='text-[13px] text-white/85'
                        icon={
                          <Book theme='outline' size='15' fill={FORM_ICON_FILL} />
                        }
                      >
                        <Input
                          value={item.name}
                          placeholder='请输入项目名称'
                          onChange={(e) => handleChange(e, index, 'name')}
                        />
                      </FormItem>
                    </Col>
                    <Col span={12}>
                      <FormItem
                        label='担任角色'
                        labelClassName='text-[13px] text-white/85'
                        icon={
                          <Avatar
                            theme='outline'
                            size='15'
                            fill={FORM_ICON_FILL}
                          />
                        }
                      >
                        <Input
                          value={item.role}
                          placeholder='请输入担任角色'
                          onChange={(e) => handleChange(e, index, 'role')}
                        />
                      </FormItem>
                    </Col>
                    <Col span={24}>
                      <FormItem
                        label='项目时间'
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
                        label='项目描述'
                        labelClassName='text-[13px] text-white/85'
                        icon={
                          <EditOne
                            theme='outline'
                            size='15'
                            fill={FORM_ICON_FILL}
                          />
                        }
                      >
                        <Input.TextArea
                          value={item.description}
                          autoSize={{ minRows: 7 }}
                          placeholder='请输入项目描述'
                          onChange={(e) => handleChange(e, index, 'description')}
                        />
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
            <Empty description='暂无项目经历' />
          )}
        </div>
      ) : null}
    </div>
  );
}

export default memo(observer(Project));
