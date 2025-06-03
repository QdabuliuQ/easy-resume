import { memo } from "react";
import Main from "./components/main";
import Panel from "./components/panel";

export default memo(function Edit() {
    return (  
        <div className="w-screen h-screen overflow-hidden">
            <div className="mt-[50px] ml-[150px] mr-[150px] flex items-start justify-center">
                <Panel />
                <Main />
            </div>
        </div>
    );
});