import { fabric } from 'fabric';
import createHeader1 from './header/header1';
import { rowMargin } from './utils/constant';
import { GlobalStyle } from './utils/common.type';
interface ProjectItemProps {
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface ProjectProps {
  id: string;
  type: 'project';
  options: {
    title: string;
    items: ProjectItemProps[];
  };
}

function createProjectItem(
  props: ProjectItemProps,
  header: fabric.Group,
  globalStyle: GlobalStyle
) {
  const { name, role, startDate, endDate, description } = props;

  const nameText = new fabric.Text(name, {
    left: 0,
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
    left: (globalStyle.width ?? 0) - (dateText.width ?? 0) - 5,
  });

  const roleText = new fabric.Text(role, {
    left: globalStyle.horizontalMargin,
    top: (nameText.top ?? 0) + (nameText.height ?? 0) + rowMargin,
    fontSize: globalStyle.fontSize,
    fill: 'black',
  });

  const descriptionText = new fabric.Textbox(description, {
    width: globalStyle.width,
    left: globalStyle.horizontalMargin,
    top: (roleText.top ?? 0) + (roleText.height ?? 0) + rowMargin,
    fontSize: globalStyle.fontSize,
    fill: 'black',
    lineHeight: globalStyle.lineHeight,
    textAlign: 'left',
    splitByGrapheme: true,
  });

  return new fabric.Group([nameText, roleText, descriptionText, dateText], {
    width: (globalStyle.width ?? 0) - (globalStyle.horizontalMargin ?? 0) * 2,
    left: 0,
  });
}

export default function createProjectModule(
  props: ProjectProps,
  globalStyle: GlobalStyle
) {
  const { items } = props.options;
  const { width, horizontalMargin } = globalStyle;
  const header = createHeader1(props.options, globalStyle);
  const project = new fabric.Group([header], {
    originX: 'left',
    originY: 'top',
    lockMovementX: true,
    lockMovementY: true,
    hasControls: false,
    property: {
      ...props,
      type: 'project',
    },
  } as any);
  header.set({
    left: -(width - horizontalMargin * 2) / 2,
  });

  const projectGroups: fabric.Group[] = [];
  for (const item of items) {
    const group = createProjectItem(item, header, globalStyle);
    if (projectGroups.length > 0) {
      group.set({
        top:
          (projectGroups[projectGroups.length - 1].top ?? 0) +
          (projectGroups[projectGroups.length - 1].height ?? 0) +
          rowMargin,
      });
    }
    projectGroups.push(group);
    project.addWithUpdate(group);
    group.set({
      width: width - horizontalMargin * 2,
      left: -(width - horizontalMargin * 2) / 2,
    });
    for (let i = 0; i < group._objects.length - 1; i++) {
      group._objects[i].set({
        left: -(width - horizontalMargin * 2) / 2,
      });
    }
  }
  project.set({
    width: width - horizontalMargin * 2,
    left: horizontalMargin,
  });
  for (let i = 0; i < project._objects.length; i++) {
    project._objects[i].set({
      left: -(width - horizontalMargin * 2) / 2,
    });
  }

  return project;
}
