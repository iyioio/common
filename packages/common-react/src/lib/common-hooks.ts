import { useId } from "react";

export function useAlphaId(){
    return useId().replace(/\W/g,'_');
}
