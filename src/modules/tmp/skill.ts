import { fabric } from 'fabric';
import createHeader1 from './header1';
import { GlobalStyle } from '@/modules/utils/common.type';

interface SkillModuleProps {
  id: string;
  type: 'skill';
  options: {
    title: string;
    description: string;
  };
}

export default function createSkillModule(
  props: SkillModuleProps,
  globalStyle: GlobalStyle
) {
  const { description } = props.options;

  const { horizontalMargin, fontSize, lineHeight, width } = globalStyle;

  const header = createHeader1(props.options, globalStyle);
  const descriptionText = new fabric.Textbox(description, {
    width: width - horizontalMargin * 2 - 20,
    left: 0,
    top: (header.height ?? 0) + 10,
    fontSize,
    fill: 'black',
    lineHeight,
    textAlign: 'left',
    splitByGrapheme: true,
  });
  const group = new fabric.Group([header, descriptionText], {
    width: width - horizontalMargin * 2,
    left: horizontalMargin,
    lockMovementX: true,
    lockMovementY: true,
    hasControls: false,
    property: {
      ...props,
      type: 'skill',
    },
  } as any);

  header.set({
    left: -(width - horizontalMargin * 2) / 2,
  });

  return group;
}
