import { fabric } from 'fabric';
import { columnMargin, rowMargin } from '../utils/constant';
import { GlobalStyle } from '../utils/common.type';

export interface InfoProps {
  id: string;
  type: 'info1';
  options: {
    name: string; // 姓名
    phone: string; // 手机号
    email: string; // 邮件
    city: string; // 当前城市
    status: string; // 当前状态
    intentCity: string; // 意向城市
    intentPosts: string; // 意向职位
    wechat: string; // 微信号
    birthday: string; // 生日
    gender: string; // 性别
    stature: string; // 身高
    weight: string; // 体重
    ethnic: string; // 民族
    origin: string; // 籍贯
    maritalStatus: string; // 婚姻状况
    politicalStatus: string; // 政治面貌
    site: string; // 个人网站
    avatar: string; // 头像
    expectedSalary: Array<string>; // 期望薪资
    layout: Array<Array<string>>; // 布局
  };
}

function createNameRow(name: string) {
  const nameText = new fabric.Text(name, {
    top: 0,
    left: 0,
    fontSize: 20,
    lineHeight: 1,
    fontWeight: 'bold',
  });
  return nameText;
}

function createSplitLine(width: number, height: number, left: number) {
  return new fabric.Rect({
    width,
    height,
    fill: '#ccc',
    left,
    top: 0,
  });
}

function createRow(
  row: Array<keyof InfoProps['options']>,
  props: InfoProps,
  globalStyle: GlobalStyle
) {
  const { fontSize, lineHeight } = globalStyle;
  const items: Array<fabric.Text | fabric.Rect> = [];
  let i = 0;
  for (const item of row) {
    if (Boolean(props.options[item as keyof InfoProps['options']])) {
      i++;
      let text: fabric.Text;
      if (item === 'expectedSalary' && props.options[item].length === 2) {
        text = new fabric.Text(
          (
            props.options[item as keyof InfoProps['options']] as Array<string>
          ).join('-'),
          {
            top: 0,
            left: 0,
            fontSize,
            lineHeight,
          }
        );
      } else {
        text = new fabric.Text(
          props.options[item as keyof InfoProps['options']] as string,
          {
            top: 0,
            left: 0,
            fontSize,
            lineHeight,
          }
        );
      }
      if (items.length > 0) {
        text.set({
          left:
            (items[items.length - 1].width ?? 0) +
            (items[items.length - 1].left ?? 0) +
            columnMargin,
        });
      }
      items.push(text);
      if (i < row.length) {
        const line = createSplitLine(
          1,
          14,
          (items[items.length - 1].width ?? 0) +
            (items[items.length - 1].left ?? 0) +
            columnMargin
        );
        items.push(line);
      }
    }
  }
  return new fabric.Group(items, { left: 0 });
}

function bindUpdate(instance: fabric.Group) {
  (instance as any).update = (props: InfoProps, globalStyle: GlobalStyle) => {
    createInfo1(props, globalStyle, true).then((info) => {
      for (const item of instance._objects) {
        instance.removeWithUpdate(item);
      }
      instance._objects = info as Array<fabric.Group>;
      instance.canvas?.renderAll();
      instance.set({
        property: {
          ...props,
        },
      } as any);
    });
  };
}

export default function createInfo1(
  props: InfoProps,
  globalStyle: GlobalStyle,
  isBind: boolean = false
): Promise<fabric.Group | Array<fabric.Object>> {
  const { layout, name, avatar } = props.options;
  const { horizontalMargin, width } = globalStyle;

  return new Promise((resolve) => {
    const rows: Array<fabric.Group | fabric.Text> = [];
    for (const row of layout) {
      const rowGroup = createRow(row as Array<any>, props, globalStyle);
      if (rows.length > 0) {
        rowGroup.set({
          top:
            (rows[rows.length - 1].height ?? 0) +
            (rows[rows.length - 1].top ?? 0) +
            rowMargin,
          left: 0,
        });
      } else {
        const nameRow = createNameRow(name);
        rowGroup.set({
          top: (nameRow.height ?? 0) + (nameRow.top ?? 0) + rowMargin,
          left: 0,
        });
        rows.push(nameRow);
      }
      rows.push(rowGroup);
    }
    const data = new fabric.Group(rows, {
      top: 0,
    });
    fabric.Image.fromURL(avatar, (img) => {
      img.set({
        left: width,
        top: 0,
      });
      const info = new fabric.Group([data], {
        width: width - horizontalMargin * 2,
        left: horizontalMargin,
        top: 0,
        lockMovementX: true,
        lockMovementY: true,
        hasControls: false,
        property: {
          ...props,
          type: 'info1',
        },
      } as any);
      // 添加update方法
      bindUpdate(info);
      var image = new Image();
      image.src = avatar;
      if (image.complete) {
        img.set({
          originX: 'left',
          originY: 'top',
          scaleX: 100 / image.width,
          scaleY: 100 / image.width,
        });
        info.addWithUpdate(img);
        img.set({
          top: -(((img.height ?? 0) * (img.scaleY ?? 1)) / 2),
        });
        data.set({
          left: -((width - horizontalMargin * 2) / 2),
        });
        info.set({
          width: width - horizontalMargin * 2,
          left: horizontalMargin,
        });
        resolve(isBind ? info._objects : info);
      } else {
        image.onload = function () {
          img.set({
            originX: 'left',
            originY: 'top',
            scaleX: 100 / image.width,
            scaleY: 100 / image.width,
          });
          info.addWithUpdate(img);
          img.set({
            top: -(((img.height ?? 0) * (img.scaleY ?? 1)) / 2),
          });
          data.set({
            left: -((width - horizontalMargin * 2) / 2),
          });
          info.set({
            width: width - horizontalMargin * 2,
            left: horizontalMargin,
          });
          resolve(isBind ? info._objects : info);
        };
      }
    });
  });
}
