'use client';
import {
  FileDoneOutlined,
  ProjectOutlined,
  ReadOutlined,
  SolutionOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { More } from '@icon-park/react';

export function HeaderTypeIcon({ moduleType, color }: { moduleType?: string; color: string }) {
  if (moduleType === 'education') {
    return <ReadOutlined style={{ color }} />;
  }
  if (moduleType === 'job') {
    return <SolutionOutlined style={{ color }} />;
  }
  if (moduleType === 'project') {
    return <ProjectOutlined style={{ color }} />;
  }
  if (moduleType === 'skill') {
    return <ThunderboltOutlined style={{ color }} />;
  }
  if (moduleType === 'certificate') {
    return <FileDoneOutlined style={{ color }} />;
  }
  if (moduleType === 'other') {
    return <More theme='outline' size={13} fill='#fff' />;
  }
  return <ReadOutlined style={{ color: '#fff' }} />;
}
