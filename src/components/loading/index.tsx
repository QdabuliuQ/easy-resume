import { Spin } from 'antd';
import { memo } from 'react';

import styles from './index.module.less';

export default memo(function Loading() {
  return (
    <div className={styles.loading}>
      <div className={styles.loadingContainer}>
        <Spin size='large' />
        <span className={styles.loadingText}>加载中</span>
      </div>
    </div>
  );
});
