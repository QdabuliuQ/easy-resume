import { fabric } from "fabric";
import createHeader1, { type HeaderProps } from "./header/header1";
import { getRandomId } from "@/utils";
import { GlobalStyle } from "@/modules/utils/common.type";

interface SkillModuleProps extends HeaderProps, GlobalStyle {
    description: string;
}

export default function createSkillModule(props: SkillModuleProps) {
    const { title, description, fontSize, lineHeight, margin, color, width, height } = props;

    const header = createHeader1({ title, color, fontSize, margin, width, height, lineHeight });
    const descriptionText = new fabric.Textbox(description, {
        width: width - margin * 2,
        left: margin,
        top: (header.height ?? 0) + 10,
        fontSize,
        fill: "black",
        lineHeight,
        textAlign: 'left',
        splitByGrapheme: true,
    })
    const group = new fabric.Group([
        header,
        descriptionText,
    ], {
        width: width - margin * 2,
        left: margin,
        lockMovementX: true,
        lockMovementY: true,
        hasControls: false,
        property: {
            type: "skill",
            id: getRandomId(),
        }
    } as any)

    header.set({
        left: -(width - margin * 2) / 2,
    });
    
    return group;
}