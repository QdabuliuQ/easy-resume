'use client';
import { App } from 'antd';

export function useAppMessage() {
  return App.useApp().message;
}
