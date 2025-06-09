import { fabric } from 'fabric';
import createHeader1, { type HeaderProps } from './header/header1';
import { GlobalStyle } from '@/modules/utils/common.type';

interface SkillModuleProps extends HeaderProps, GlobalStyle {
  description: string;
}

export default function createSkillModule(props: SkillModuleProps) {
  const {
    title,
    description,
    fontSize,
    lineHeight,
    horizontalMargin,
    color,
    width,
    height,
  } = props;

  const header = createHeader1({
    title,
    color,
    fontSize,
    horizontalMargin,
    width,
    height,
    lineHeight,
  });
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
      type: 'skill',
      ...props,
    },
  } as any);
  console.log(descriptionText, group);

  header.set({
    left: -(width - horizontalMargin * 2) / 2,
  });

  return group;
}
