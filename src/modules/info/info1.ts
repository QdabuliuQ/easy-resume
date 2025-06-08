import { fabric } from "fabric";
import { columnMargin, rowMargin } from "../utils/constant";
import { GlobalStyle } from "../utils/common.type";
import { getRandomId } from "@/utils";

export interface InfoProps extends GlobalStyle {
    name: string  // 姓名
    phone: string  // 手机号
    email: string  // 邮件
    city: string  // 当前城市
    status: string  // 当前状态
    intentCity: string  // 意向城市
    intentPosts: string  // 意向职位
    wechat: string  // 微信号
    birthday: string  // 生日
    gender: string  // 性别
    stature: string  // 身高
    weight: string  // 体重
    ethnic: string  // 民族
    origin: string  // 籍贯
    maritalStatus: string  // 婚姻状况
    politicalStatus: string  // 政治面貌
    site: string  // 个人网站
    avatar: string  // 头像
    expectedSalary: Array<string>  // 期望薪资
    layout: Array<Array<string>>  // 布局
}

function createNameRow(name: string) {
    const nameText = new fabric.Text(name, {
        top: 0,
        left: 0,
        fontSize: 20,
        lineHeight: 1,
        fontWeight: 'bold',
    })
    return nameText
}

function createSplitLine(width: number, height: number, left: number) {
    return new fabric.Rect({
        width,
        height,
        fill: '#ccc',
        left,
        top: 0
    })
}

function createRow(row: Array<keyof InfoProps>, props: InfoProps) {
    const { fontSize, lineHeight } = props;
    const items: Array<fabric.Text | fabric.Rect> = [];
    let i = 0;
    for (const item of row) {
        if (props[item as keyof InfoProps]) {
            i ++
            let text: fabric.Text;
            if (item === 'expectedSalary' && props[item].length === 2) {
                text = new fabric.Text((props[item as keyof InfoProps] as Array<string>).join('-'), {
                    top: 0,
                    left: 0,
                    fontSize,
                    lineHeight,
                })
            } else {
                text = new fabric.Text(props[item as keyof InfoProps] as string, {
                    top: 0,
                    left: 0,
                    fontSize,
                    lineHeight,
                })
            }
            if (items.length > 0) {
                text.set({
                    left: (items[items.length - 1].width ?? 0) + (items[items.length - 1].left ?? 0) + columnMargin,
                })
            }
            items.push(text);
            if (i < row.length) {
                const line = createSplitLine(1, 14, (items[items.length - 1].width ?? 0) + (items[items.length - 1].left ?? 0) + columnMargin)
                items.push(line);
            }
        }
    }
    return new fabric.Group(items, {left: 0})
}

export default function createInfo1(props: InfoProps): Promise<fabric.Group> {
    const { horizontalMargin, width } = props;
    return new Promise((resolve) => {
        const layout: Array<Array<keyof InfoProps>> = [
            ['phone', 'email', 'city'],
            ['wechat', 'site'],
            ['birthday', 'gender', 'stature', 'weight', 'origin', 'ethnic', 'politicalStatus', 'maritalStatus'],
            ['status', 'intentCity', 'intentPosts', 'expectedSalary'],
        ];
        const rows: Array<fabric.Group | fabric.Text> = []
        for (const row of layout) {
            const rowGroup = createRow(row, props)
            if (rows.length > 0) {
                rowGroup.set({
                    top: (rows[rows.length - 1].height ?? 0) + (rows[rows.length - 1].top ?? 0) + rowMargin,
                    left: 0
                })
            } else {
                const nameRow = createNameRow(props.name)
                rowGroup.set({
                    top: (nameRow.height ?? 0) + (nameRow.top ?? 0) + rowMargin,
                    left: 0
                })
                rows.push(nameRow)
            }
            rows.push(rowGroup)
        }
        const data = new fabric.Group(rows, {
            top: 0,
        })
        fabric.Image.fromURL(props.avatar, (img) => {
            img.set({
                left: width,
                top: 0,
            })
            const info = new fabric.Group([data], {
                width: width - horizontalMargin * 2,
                left: horizontalMargin,
                top: 0,
                lockMovementX: true,
                lockMovementY: true,
                hasControls: false,
                property: {
                    type: 'info1',
                    id: getRandomId(),
                }
            } as any)
            var image = new Image();
            image.src = props.avatar;
            if (image.complete) {
                img.set({
                    originX: 'left',
                    originY: 'top',
                    scaleX: 100 / image.width,
                    scaleY: 100 / image.width,

                })
                info.addWithUpdate(img)
                img.set({
                    top: -((img.height ?? 0) * (img.scaleY ?? 1) / 2),
                })
                data.set({
                    left: -((width - horizontalMargin * 2) / 2)
                })
                info.set({
                    width: width - horizontalMargin * 2,
                    left: horizontalMargin,
                })
                resolve(info)
            }else{
                image.onload = function () {
                    img.set({
                        originX: 'left',
                        originY: 'top',
                        scaleX: 100 / image.width,
                        scaleY: 100 / image.width,
    
                    })
                    info.addWithUpdate(img)
                    img.set({
                        top: -((img.height ?? 0) * (img.scaleY ?? 1) / 2),
                    })
                    data.set({
                        left: -((width - horizontalMargin * 2) / 2)
                    })
                    info.set({
                        width: width - horizontalMargin * 2,
                        left: horizontalMargin,
                    })
                    resolve(info)
                };
            }
        })
    })
}