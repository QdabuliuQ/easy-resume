import { memo } from 'react';

import { configStore } from '@/mobx';
import { observer } from 'mobx-react';
import { Col, Form, InputNumber, Row } from 'antd';
import styles from './index.module.less';
import { useMemoizedFn } from 'ahooks';

function Global() {
  const global = configStore.getConfig?.globalStyle;
  const [form] = Form.useForm();

  const handleChange = useMemoizedFn((value: number, key: string) => {
    global[key] = value;
    configStore.setConfig({
      ...configStore.getConfig,
      globalStyle: global,
    });
  });

  return (
    <div className={styles.globalPanel}>
      {global && (
        <Form form={form} variant='filled' layout='vertical'>
          <Row gutter={15}>
            <Col span={12}>
              <Form.Item label={<span className={styles.label}>字体大小</span>}>
                <InputNumber
                  value={global.fontSize}
                  style={{ width: '100%' }}
                  min={1}
                  max={100}
                  addonAfter='PX'
                  onChange={(value) => handleChange(value, 'fontSize')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<span className={styles.label}>行高</span>}>
                <InputNumber
                  value={global.lineHeight}
                  style={{ width: '100%' }}
                  min={1}
                  max={100}
                  step={0.1}
                  precision={1}
                  addonAfter='PX'
                  onChange={(value) => handleChange(value, 'lineHeight')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<span className={styles.label}>左右间距</span>}>
                <InputNumber
                  value={global.horizontalMargin}
                  style={{ width: '100%' }}
                  min={1}
                  addonAfter='PX'
                  onChange={(value) => handleChange(value, 'horizontalMargin')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<span className={styles.label}>上下间距</span>}>
                <InputNumber
                  value={global.verticalMargin}
                  style={{ width: '100%' }}
                  min={1}
                  addonAfter='PX'
                  onChange={(value) => handleChange(value, 'verticalMargin')}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      )}
    </div>
  );
}

export default memo(observer(Global));
