import { fabric } from 'fabric';
import createHeader1 from './header/header1';
import { columnMargin, rowMargin } from './utils/constant';
import { GlobalStyle } from './utils/common.type';

interface JobItemProps {
  company: string;
  post: string;
  department: string;
  city: string;
  startDate: string;
  endDate: string;
  description: string;
}
interface JobProps {
  id: string;
  type: 'job';
  options: {
    title: string;
    items: JobItemProps[];
  };
}

function createJobItem(
  props: JobItemProps,
  header: fabric.Group,
  globalStyle: Partial<GlobalStyle>
) {
  const { company, post, department, city, startDate, endDate, description } =
    props;

  const companyText = new fabric.Text(company, {
    left: 1,
    top: (header.height ?? 0) + rowMargin,
    fontSize: globalStyle.fontSize,
    fill: 'black',
    fontWeight: 'bold',
  });
  const dateText = new fabric.Text(`${startDate} - ${endDate}`, {
    top: (header.height ?? 0) + rowMargin,
    fontSize: globalStyle.fontSize,
    fill: 'black',
  });
  dateText.set({
    left:
      (globalStyle.width ?? 0) -
      (globalStyle.horizontalMargin ?? 0) * 2 -
      (dateText.width ?? 0),
  });
  const postText = new fabric.Text(post, {
    left: 1,
    top: (companyText.top ?? 0) + (companyText.height ?? 0) + rowMargin,
    fontSize: globalStyle.fontSize,
    fill: 'black',
  });
  const departmentText = new fabric.Text(department, {
    left: (postText.width ?? 0) + columnMargin,
    top: (companyText.top ?? 0) + (companyText.height ?? 0) + rowMargin,
    fontSize: globalStyle.fontSize,
    fill: 'black',
  });
  const cityText = new fabric.Text(city, {
    top: (companyText.top ?? 0) + (companyText.height ?? 0) + rowMargin,
    fontSize: globalStyle.fontSize,
    fill: 'black',
  });

  cityText.set({
    left:
      (globalStyle.width ?? 0) -
      (globalStyle.horizontalMargin ?? 0) * 2 -
      (cityText.width ?? 0),
  });
  const descriptionText = new fabric.Textbox(description, {
    width:
      (globalStyle.width ?? 0) - (globalStyle.horizontalMargin ?? 0) * 2 - 5,
    left: 0,
    top: (cityText.top ?? 0) + (cityText.height ?? 0) + rowMargin,
    fontSize: globalStyle.fontSize,
    fill: 'black',
    lineHeight: globalStyle.lineHeight,
    textAlign: 'left',
    splitByGrapheme: true,
  });

  const group = new fabric.Group([
    companyText,
    postText,
    departmentText,
    descriptionText,
    cityText,
    dateText,
  ]);

  return group;
}

export default function createJobModule(
  props: JobProps,
  globalStyle: GlobalStyle
) {
  const { items } = props.options;
  const { width, horizontalMargin } = globalStyle;

  const header = createHeader1(props.options, globalStyle);

  const groups: fabric.Group[] = [];
  for (const item of items) {
    const group = createJobItem(item, header, globalStyle);
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
  const jobModule = new fabric.Group([header, ...groups], {
    width: width - horizontalMargin * 2,
    left: horizontalMargin,
    lockMovementX: true,
    lockMovementY: true,
    hasControls: false,
    property: {
      ...props,
      type: 'job',
    },
  } as any);
  header.set({
    left: -(width - horizontalMargin * 2) / 2,
  });

  for (let i = 0; i < jobModule._objects.length; i++) {
    jobModule._objects[i].set({
      width: width - horizontalMargin * 2,
      left: -(width - horizontalMargin * 2) / 2,
    });
  }

  return jobModule;
}
