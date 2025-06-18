import createHeader1 from './header/header1';
import { fabric } from 'fabric';
import { rowMargin } from './utils/constant';
import { GlobalStyle } from './utils/common.type';

interface CertificateItemProps {
  name: string;
  date: string;
}

interface CertificateProps {
  id: string;
  type: 'certificate';
  options: {
    title: string;
    items: CertificateItemProps[];
  };
}

function createCertificateItem(
  props: CertificateItemProps,
  globalStyle: GlobalStyle
) {
  const { name, date } = props;
  const nameText = new fabric.Text(name, {
    fontSize: globalStyle.fontSize,
    fill: 'black',
  });
  const dateText = new fabric.Text(date, {
    fontSize: globalStyle.fontSize,
    fill: 'black',
  });
  dateText.set({
    left:
      globalStyle.width -
      globalStyle.horizontalMargin -
      (dateText.width ?? 0) -
      5,
  });
  const group = new fabric.Group([nameText, dateText]);
  return group;
}

export default function createCertificateModule(
  props: CertificateProps,
  globalStyle: GlobalStyle
) {
  const { items } = props.options;
  const { horizontalMargin, width } = globalStyle;
  const header = createHeader1(props.options, globalStyle);

  const groups: Array<fabric.Group> = [];
  for (const item of items) {
    const group = createCertificateItem(item, globalStyle);
    if (groups.length > 0) {
      group.set({
        top:
          (groups[groups.length - 1].top ?? 0) +
          (groups[groups.length - 1].height ?? 0) +
          rowMargin,
      });
    } else {
      group.set({
        top: (header.top ?? 0) + (header.height ?? 0) + rowMargin,
      });
    }
    groups.push(group);
  }
  const certificateModule = new fabric.Group([header, ...groups], {
    width: width - horizontalMargin * 2,
    left: horizontalMargin,
    lockMovementX: true,
    lockMovementY: true,
    hasControls: false,
    property: {
      ...props,
      type: 'certificate',
    },
  } as any);

  header.set({
    left: -(width - horizontalMargin * 2) / 2,
  });
  return certificateModule;
}
