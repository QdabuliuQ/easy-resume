import createHeader1 from './header1';
import { fabric } from 'fabric';
import { columnMargin, rowMargin } from '../utils/constant';
import { GlobalStyle } from '../utils/common.type';

interface EducationItemProps {
  school: string;
  degree: string;
  major: string;
  academy: string;
  type: string;
  startDate: string;
  endDate: string;
  city: string;
  tags: Array<string>;
  description: string;
}

interface EducationProps {
  id: string;
  type: 'education';
  options: {
    title: string;
    items: EducationItemProps[];
  };
}

function createTag(tag: string) {
  const tagText = new fabric.Text(tag, {
    fontSize: 10,
    fill: '#6992f8',
  });
  const bgRect = new fabric.Rect({
    width: (tagText.width ?? 0) + 10,
    height: (tagText.height ?? 0) + 7,
    fill: '#eaf1fe',
    rx: 4,
    ry: 4,
  });
  tagText.set({
    left: ((bgRect.width ?? 0) - (tagText.width ?? 0)) / 2,
    top: ((bgRect.height ?? 0) - (tagText.height ?? 0)) / 2,
  });
  const group = new fabric.Group([bgRect, tagText]);
  return group;
}

function createEducationItem(
  props: EducationItemProps,
  header: fabric.Group,
  globalStyle: GlobalStyle
) {
  const {
    school,
    degree,
    major,
    type,
    startDate,
    endDate,
    city,
    tags,
    academy,
    description,
  } = props;
  const { fontSize, lineHeight, horizontalMargin, width } = globalStyle;
  const schoolText = new fabric.Text(school ?? '', {
    left: 0,
    top: (header.height ?? 0) + rowMargin,
    fontSize,
    fill: 'black',
  });
  const typeText = new fabric.Text(type ?? '', {
    left: (schoolText.width ?? 0) + columnMargin,
    top: (header.height ?? 0) + rowMargin,
    fontSize,
    fill: 'black',
  });
  const tGroup: Array<fabric.Group> = [];
  for (const tag of tags) {
    const tagGroup = createTag(tag);
    if (tGroup.length > 0) {
      tagGroup.set({
        left:
          (tGroup[tGroup.length - 1].left ?? 0) +
          (tGroup[tGroup.length - 1].width ?? 0) +
          columnMargin,
      });
    } else {
      tagGroup.set({
        left: (typeText.left ?? 0) + (typeText.width ?? 0) + columnMargin,
      });
    }
    tGroup.push(tagGroup);
  }
  const tagsGroups = new fabric.Group(tGroup, {
    top:
      (header.top ?? 0) +
      (header.height ?? 0) +
      rowMargin -
      ((tGroup[0].height ?? 0) - (schoolText.height ?? 0)) / 2,
    left: (typeText.left ?? 0) + (typeText.width ?? 0) + columnMargin,
  });

  const dateText = new fabric.Text(`${startDate} - ${endDate}`, {
    top: (header.height ?? 0) + rowMargin,
    fontSize,
    fill: 'black',
  });
  dateText.set({
    left: (width ?? 0) - (horizontalMargin ?? 0) * 2 - (dateText.width ?? 0),
  });
  const majorText = new fabric.Text(major, {
    left: 0,
    top: (schoolText.top ?? 0) + (schoolText.height ?? 0) + rowMargin,
    fontSize,
    fill: 'black',
  });
  const degreeText = new fabric.Text(degree ?? '', {
    left: (majorText.left ?? 0) + (majorText.width ?? 0) + columnMargin,
    top: (schoolText.top ?? 0) + (schoolText.height ?? 0) + rowMargin,
    fontSize,
    fill: 'black',
  });
  const academyText = new fabric.Text(academy ?? '', {
    left: (degreeText.left ?? 0) + (degreeText.width ?? 0) + columnMargin,
    top: (schoolText.top ?? 0) + (schoolText.height ?? 0) + rowMargin,
    fontSize,
    fill: 'black',
  });
  const cityText = new fabric.Text(city ?? '', {
    top: (schoolText.top ?? 0) + (schoolText.height ?? 0) + rowMargin,
    fontSize,
    fill: 'black',
  });
  cityText.set({
    left: (width ?? 0) - (horizontalMargin ?? 0) * 2 - (cityText.width ?? 0),
  });
  const descriptionText = new fabric.Textbox(description ?? '', {
    width: (width ?? 0) - (horizontalMargin ?? 0) * 2,
    left: 0,
    top: (cityText.top ?? 0) + (cityText.height ?? 0) + rowMargin,
    fontSize,
    fill: 'black',
    lineHeight,
    textAlign: 'left',
    splitByGrapheme: true,
  });
  const group = new fabric.Group([
    schoolText,
    typeText,
    tagsGroups,
    dateText,
    majorText,
    degreeText,
    academyText,
    cityText,
    descriptionText,
  ]);

  group.set({
    width: (width ?? 0) - (horizontalMargin ?? 0) * 2,
    left: 0,
  });
  return group;
}
export default function createEducationModule(
  props: EducationProps,
  globalStyle: GlobalStyle
) {
  const { items } = props.options;
  const { width, horizontalMargin } = globalStyle;

  const header = createHeader1(props.options, globalStyle);

  const groups: fabric.Group[] = [];
  for (const item of items) {
    const group = createEducationItem(item, header, globalStyle);
    if (groups.length > 0) {
      group.set({
        top:
          (groups[groups.length - 1].top ?? 0) +
          (groups[groups.length - 1].height ?? 0) +
          rowMargin,
      });
    }
    groups.push(group);
  }
  const educationModule = new fabric.Group([header, ...groups], {
    width: width - horizontalMargin * 2,
    left: horizontalMargin,
    lockMovementX: true,
    lockMovementY: true,
    hasControls: false,
    property: {
      ...props,
      type: 'education',
    },
  } as any);
  header.set({
    left: -(width - horizontalMargin * 2) / 2,
  });
  return educationModule;
}
