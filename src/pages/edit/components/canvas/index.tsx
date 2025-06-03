import { memo } from "react";
import { fabric } from "fabric";
import { useMemoizedFn, useMount } from "ahooks";
import createSkillModule from "@/modules/skill";
import createJobModule from "@/modules/job";
import createEducationModule from "@/modules/education";
import createCertificateModule from "@/modules/certificate";
import createInfo1 from "@/modules/info/info1";
import createProjectModule from "@/modules/project";

import resume from "@/json/resume";
import { moduleMargin } from "@/modules/utils/constant";
console.log(resume, 'resume');


function Canvas() {
    // 重置dom
    const resetDom = useMemoizedFn((width: number, height: number) => {
        const canvasBox = document.getElementById("canvas-box");
        if (!canvasBox) return;
        canvasBox.innerHTML = "";
        const canvas: any = document.createElement("canvas");
        canvas.id = "canvas";
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        canvas.width = width;
        canvas.height = height;
        canvasBox.appendChild(canvas);
    })

    useMount(async () => {
        resetDom(resume.globalStyle.width, resume.globalStyle.height);
        const canvas = new fabric.Canvas("canvas");
        const groups: fabric.Group[] = [];
        for (const item of resume.template) {
            const { type, options } = item;
            let module: fabric.Group | null = null;
            const _options = {
                ...resume.globalStyle,
                ...options,
            }
            if (type === 'skill') {
                module = createSkillModule(_options);
            } else if (type === 'job') {
                module = createJobModule(_options);
            } else if (type === 'education') {
                module = createEducationModule(_options);
            } else if (type === 'certificate') {
                module = createCertificateModule(_options);
            } else if (type === 'info1') {
                module = await createInfo1(_options);
            } else if (type === 'project') {
                module = createProjectModule(_options);
            }
            if (module) {

                if (groups.length > 0) {
                    module.set({
                        top: (groups[groups.length - 1].height ?? 0) + (groups[groups.length - 1].top ?? 0) + moduleMargin,
                    })
                }
                groups.push(module);
                canvas.add(module);
            }
        }
        // canvas.add(createSkillModule({
        //     title: "技能",
        //     description: "1、技能技技能技能描述描述能技能技技能技能描述描述能描述描述技能技技能技能描述描述能描述描述技能技技能技能描述描述能描述描述技能技技能技能描述描述能描述描述描述描述\n2、12312\n2、12312\n2、12312\n2、12312",
        //     color: "#ba443a",
        // }));

        // canvas.add(createJobModule({
        //     title: "工作经历",
        //     color: "#ba443a",
        //     items: [
        //         {
        //             company: "公司",
        //             post: "职位",
        //             department: "部门",
        //             city: "城市",
        //             startDate: "2020-01-01",
        //             endDate: "2021-01-01",
        //             description: "描描描述描述描述描述描述描述描述描述述描描述描述描述描述描述描述描述描述述描描述描述描述描述描述描述描述描述述描描述描述描述描述描述描述描述描述述描描述描述描述描述描述描述描述描述述描描述描述描述描述描述描述描述描述述描述描述描述描述描述描述描述描述述",
                    
        //         },
        //         {
        //             company: "公司",
        //             post: "职位",
        //             department: "部门",
        //             city: "城市",
        //             startDate: "2020-01-01",
        //             endDate: "2021-01-01",
        //             description: "描描描述描述描述描述描述描述描述描述述描描述描述描述描述描述描述描述描述述描描述描述描述描述描述描述描述描述述描描述描述描述描述描述描述描述描述述描描述描述描述描述描述描述描述描述述描描述描述描述描述描述描述描述描述述描述描述描述描述描述描述描述描述述",
                    
        //         }
        //     ]
        // }))

        // canvas.add(createEducationModule({
        //     title: "教育经历",
        //     color: "#ba443a",
        //     items: [
        //         {
        //             school: "学校",
        //             degree: "学位",
        //             major: "专业",
        //             type: "类型",
        //             startDate: "2020-01-01",
        //             endDate: "2021-01-01",
        //             city: "城市",
        //             tags: ["标签1", "标签2"],
        //             academy: "学院",
        //             description: "描述",
        //         }
        //     ]
        // }))

        // canvas.add(createCertificateModule({
        //     title: "证书",
        //     color: "#ba443a",
        //     items: [
        //         { name: "证书1", date: "2020-01-01" },
        //         { name: "证书2", date: "2020-01-01" },
        //     ]
        // }))

        // canvas.add(await createInfo1({
        //     name: "张三",
        //     phone: "12345678901",
        //     email: "zhangsan@163.com",
        //     city: "北京",
        //     status: "在职",
        //     intentCity: "北京",
        //     intentPosts: "前端开发工程师",
        //     wechat: "zhangsan",
        //     birthday: "1990-01-01",
        //     gender: "男",
        //     height: "180cm",
        //     weight: "70kg",
        //     ethnic: "汉族",
        //     origin: "北京",
        //     maritalStatus: "已婚",
        //     politicalStatus: "中共党员",
        //     site: "https://www.baidu.com",
        //     expectedSalary: ["10k", "20k"],
        //     avatar: 'https://lf-flow-web-cdn.doubao.com/obj/flow-doubao/samantha/logo-icon-white-bg.png',
        //     layout: [
        //         ["phone", "email", "city"],
        //         ["wechat", "site"],
        //         ["birthday", "gender", "height", "weight", "origin", "ethnic", "politicalStatus", "maritalStatus"],
        //         ["status", "intentCity", "intentPosts", "expectedSalary"],
        //     ]
        // }))

        // canvas.add(createProjectModule({
        //     title: "项目经历",
        //     color: "#ba443a",
        //     items: [
        //         {
        //             name: "项目1",
        //             role: "角色",
        //             startDate: "2020-01-01",
        //             endDate: "2021-01-01",
        //             description: "描述",
        //         }
        //     ]
        // }))
    })

    return ( 
        <div className="w-full mt-[20px] bg-white h-[calc(100vh-100px)] rounded-md overflow-hidden">
            <div id="canvas-box" className="flex justify-center">
            </div>
        </div>
    );
}

export default memo(Canvas);