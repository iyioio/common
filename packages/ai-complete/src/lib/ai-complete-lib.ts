import { AiCompletionMessage } from "./ai-complete-types";

export const aiCompleteModelCliam='aiCompleteModel';

export const aiCompleteDefaultModel='default'

export const mergeAiCompletionMessages=(src:AiCompletionMessage[],dest:AiCompletionMessage[]):void=>{
    for(const pm of src){
        if(pm.replaceId===undefined){
            dest.push(pm);
            continue;
        }
        const i=dest.findIndex(m=>m.id===pm.replaceId);
        if(i===-1){
            dest.push(pm);
        }else{
            dest[i]=pm;
        }
    }
}
