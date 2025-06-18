import { fabric } from 'fabric';
import { GlobalStyle } from '../utils/common.type';

export interface HeaderProps extends GlobalStyle {
  title: string;
}

const HEADER_HEIGHT = 25;

export default function createHeader1(
  props: Partial<HeaderProps>,
  globalStyle: GlobalStyle
) {
  const { title } = props;
  const { color, fontSize, horizontalMargin, width } = globalStyle;
  const line = new fabric.Rect({
    width: 5,
    height: HEADER_HEIGHT,
    fill: color,
    left: 0,
    top: 0,
  });
  const text = new fabric.Text(title ?? '', {
    left: 25,
    fontSize,
    lineHeight: 1,
    fontWeight: 'bold',
    fill: color,
  });
  text.set({
    top: (HEADER_HEIGHT - (text.height ?? 0)) / 2,
  });
  const bgRect = new fabric.Rect({
    width: (width ?? 0) - (horizontalMargin ?? 0) * 2,
    height: HEADER_HEIGHT,
    fill: color,
    left: 0,
    top: 0,
    opacity: 0.1,
  });
  const group = new fabric.Group([bgRect, line, text], {
    originX: 'left',
    originY: 'top',
    width: (width ?? 0) - (horizontalMargin ?? 0) * 2,
    left: 0,
    property: {
      type: 'header1',
      color,
    },
  } as any);
  return group;
}
