import { memo } from 'react';
import styles from './index.module.less';

function Title(props: { title: string }) {
  return <div className={styles.title}>{props.title}</div>;
}

export default memo(Title);