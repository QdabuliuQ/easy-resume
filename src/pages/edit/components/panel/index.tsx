import { memo, MemoExoticComponent } from "react";
import Info1 from "./components/info1";
import { observable } from "mobx";
import { moduleActiveStore } from "@/mobx";
import { useMemoizedFn } from "ahooks";

const PanelMapped: { [key: string]: MemoExoticComponent<any> } = {
    info1: Info1
}

function Panel() {

    const PanelRender = useMemoizedFn((): any => {
        const moduleActive = moduleActiveStore.getModuleActive
        return PanelMapped[moduleActive] ? PanelMapped[moduleActive] : <div>无</div>
    })

    return ( 
        <div className="w-[400px] bg-white mr-[20px] rounded-md text-black">
            <div className="p-[20px]">
                { PanelRender() }
            </div>
        </div>
    );
}

export default observable(memo(Panel));