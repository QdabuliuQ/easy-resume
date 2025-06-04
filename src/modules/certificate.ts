import createHeader1, { type HeaderProps } from "./header/header1";
import { fabric } from "fabric";
import { rowMargin } from "./utils/constant";
import { GlobalStyle } from "./utils/common.type";

interface CertificateItemProps {
    name: string;
    date: string;
}

interface CertificateProps extends HeaderProps, GlobalStyle {
    items: CertificateItemProps[];
}

function createCertificateItem(props: CertificateItemProps, globalStyle: Partial<GlobalStyle>) { 
    const { name, date } = props;
    const nameText = new fabric.Text(name, {
        fontSize: globalStyle.fontSize,
        fill: "black",
    })
    const dateText = new fabric.Text(date, {
        fontSize: globalStyle.fontSize,
        fill: "black",
    })
    dateText.set({
        left: (globalStyle.width ?? 0) - (globalStyle.margin ?? 0) - (dateText.width ?? 0) - 5,
    })
    const group = new fabric.Group([
        nameText,
        dateText,
    ])
    return group;
}

export default function createCertificateModule(props: CertificateProps) {
    const { title, color, items, fontSize, lineHeight, margin, width, height } = props;
    console.log(props, 'props')
    const header = createHeader1({ title, color, fontSize, lineHeight, margin, width, height });

    const groups: Array<fabric.Group> = [];
    for (const item of items) {
        const group = createCertificateItem(item, { fontSize, lineHeight, margin, width, height });
        if (groups.length > 0) {
            group.set({
                top: (groups[groups.length - 1].top ?? 0) + (groups[groups.length - 1].height ?? 0) + rowMargin,
            })
        } else {
            group.set({
                top: (header.top ?? 0) + (header.height ?? 0) + rowMargin,
            })
        }
        groups.push(group);
    }
    const certificateModule = new fabric.Group([
        header,
        ...groups,
    ], {
        width: width - margin * 2,
        left: margin,
        lockMovementX: true,
        lockMovementY: true,
        hasControls: false,
    })

    header.set({
        left: -(width - margin * 2) / 2,
    });
    return certificateModule;
}