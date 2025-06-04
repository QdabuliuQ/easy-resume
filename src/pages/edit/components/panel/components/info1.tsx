import { observable } from "mobx";
import { memo } from "react";

function Info1() {
    return (  
        <div>
            info1
        </div>
    );
}

export default observable(memo(Info1));