import { createContext, useContext } from 'react';

/** 画布 `transform: scale(...)` 的值，供子树把视口像素换算回布局坐标系 */
export const CanvasScaleContext = createContext(1);

export function useCanvasScale() {
  return useContext(CanvasScaleContext);
}
