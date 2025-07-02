import FormItem from '@/components/formItem';
import { useModuleHandle } from '@/hooks/module';
import { configStore, moduleActiveStore } from '@/mobx';
import { DocSuccess } from '@icon-park/react';
import { useDebounceFn } from 'ahooks';
import { Form, Input } from 'antd';
import { observer } from 'mobx-react';
import { memo } from 'react';

function Skill() {
  const { getModule } = useModuleHandle();

  const moduleActive = moduleActiveStore.getModuleActive;
  const module = getModule(moduleActive);

  const { run: handleChange } = useDebounceFn((e: any) => {
    const config = configStore.getConfig;
    if (!config) return;
    const module = getModule(moduleActive);
    if (!module) return;

    module.options.description = e.target.value;
    configStore.setConfig({
      ...config,
      pages: [...config.pages],
    });
  });

  return (
    <Form layout='vertical'>
      <FormItem
        label='技能'
        icon={<DocSuccess theme='outline' size='15' fill='#333' />}
      >
        <Input.TextArea
          autoSize={{ minRows: 10 }}
          placeholder='请输入技能'
          defaultValue={module?.options.description}
          onChange={(e) => handleChange(e)}
        />
      </FormItem>
    </Form>
  );
}

export default memo(observer(Skill));
