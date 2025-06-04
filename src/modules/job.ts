import { fabric } from "fabric";
import createHeader1, { type HeaderProps } from "./header/header1";
import { columnMargin, rowMargin } from "./utils/constant";
import { GlobalStyle } from "./utils/common.type";

interface JobItemProps { 
    company: string;
    post: string;
    department: string;
    city: string;
    startDate: string;
    endDate: string;
    description: string;
}
interface JobProps extends HeaderProps, GlobalStyle {
    items: JobItemProps[];
}

function createJobItem(props: JobItemProps, header: fabric.Group, globalStyle: Partial<GlobalStyle>) {
    const { company, post, department, city, startDate, endDate, description } = props;

    const companyText = new fabric.Text(company, {
        left: (globalStyle.margin ?? 0) - 5,
        top: (header.height ?? 0) + rowMargin,
        fontSize: globalStyle.fontSize,
        fill: "black",
        fontWeight: "bold",
    })
    const dateText = new fabric.Text(`${startDate} - ${endDate}`, {
        top: (header.height ?? 0) + rowMargin,
        fontSize: globalStyle.fontSize,
        fill: "black",
    })
    dateText.set({
        left: (globalStyle.width ?? 0) - (globalStyle.margin ?? 0) - (dateText.width ?? 0) - 5,
    })
    const postText = new fabric.Text(post, {
        left: (globalStyle.margin ?? 0) - 5,
        top: (companyText.top ?? 0) + (companyText.height ?? 0) + rowMargin,
        fontSize: globalStyle.fontSize,
        fill: "black",
    })
    const departmentText = new fabric.Text(department, {
        left: (postText.width ?? 0) + columnMargin,
        top: (companyText.top ?? 0) + (companyText.height ?? 0) + rowMargin,
        fontSize: globalStyle.fontSize,
        fill: "black",
    })
    const cityText = new fabric.Text(city, {
        top: (companyText.top ?? 0) + (companyText.height ?? 0) + rowMargin,
        fontSize: globalStyle.fontSize,
        fill: "black",
    })
    
    cityText.set({
        left: (globalStyle.width ?? 0) - (globalStyle.margin ?? 0) - (cityText.width ?? 0) - 5,
    })
    const descriptionText = new fabric.Textbox(description, {
        width: (globalStyle.width ?? 0) - (globalStyle.margin ?? 0) * 2,
        left: (globalStyle.margin ?? 0) - 5,
        top: (cityText.top ?? 0) + (cityText.height ?? 0) + rowMargin,
        fontSize: globalStyle.fontSize,
        fill: "black",
        lineHeight: globalStyle.lineHeight,
        textAlign: 'left',
        splitByGrapheme: true,
    })

    const group = new fabric.Group([
        companyText,
        postText,
        departmentText,
        descriptionText,
        cityText,
        dateText,
    ])

    return group
}

export default function createJobModule(props: JobProps) {
    const { title, color, items, fontSize, lineHeight, margin, width, height } = props;

    const header = createHeader1({ title, color, fontSize, lineHeight, margin, width, height });
    
    const groups: fabric.Group[] = [];
    for (const item of items) {
        const group = createJobItem(item, header, { fontSize, lineHeight, margin, width, height });
        if (groups.length > 0) {
            group.set({
                top: (groups[groups.length - 1].top ?? 0) + (groups[groups.length - 1].height ?? 0) + rowMargin,
            })
        }
        groups.push(group);
    }
    const jobModule = new fabric.Group([
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

    for (let i = 0; i < jobModule._objects.length; i++) {
        jobModule._objects[i].set({
            width: width - margin * 2,
            left: -(width - margin * 2) / 2,
        });
    }

    return jobModule;
}
