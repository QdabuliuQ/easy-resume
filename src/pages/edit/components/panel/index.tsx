import { memo } from "react";

function Panel() {
    return ( 
        <div className="w-[400px] bg-white mr-[20px] rounded-md">
            Panel
        </div>
    );
}

export default memo(Panel);