import { fabric } from 'fabric';
import createSectionHeader from './sectionHeader';
import { GlobalStyle } from '@/modules/utils/common.type';
import { cssLengthToApproxPx } from '@/utils/cssLength';

interface OtherModuleProps {
  id: string;
  type: 'other';
  options: {
    title: string;
    description: string;
  };
}

export default function createOtherModule(
  props: OtherModuleProps,
  globalStyle: GlobalStyle
) {
  const { description } = props.options;
  const pad = globalStyle.padding ?? 0;
  const { fontSize, lineHeight } = globalStyle;
  const widthPx = cssLengthToApproxPx(globalStyle.width);
  const header = createSectionHeader(props.options, globalStyle);
  const descriptionText = new fabric.Textbox(description, {
    width: widthPx - pad * 2 - 20,
    left: 0,
    top: (header.height ?? 0) + 10,
    fontSize,
    fill: 'black',
    lineHeight,
    textAlign: 'left',
    splitByGrapheme: true,
  });
  const group = new fabric.Group([header, descriptionText], {
    width: widthPx - pad * 2,
    left: pad,
    lockMovementX: true,
    lockMovementY: true,
    hasControls: false,
    property: {
      ...props,
      type: 'other',
    },
  } as any);
  header.set({
    left: -(widthPx - pad * 2) / 2,
  });
  return group;
}
