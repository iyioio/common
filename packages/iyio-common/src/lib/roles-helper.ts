const pipeReg=/|/g;

/**
 * Joins the roles array with the pipe character and wraps the returned string with pipe character.
 * @example ['admin','user',77] -> |admin|user|77|
 */
export const rolesToString=(roles:(string|number)[]|null|undefined):string=>{
    if(!roles?.length){
        return '';
    }else{
        let copied=false;
        for(let i=0;i<roles.length;i++){
            let r=roles[i];
            if((typeof r === 'string') && r.includes('|')){
                r=r.replace(pipeReg,'_PIPE_');
                if(!copied){
                    copied=true;
                    roles=[...roles];
                }
                roles[i]=r;
            }
        }
        return '|'+roles.join('|')+'|';
    }
}

export const isInRole=(role:string|number,roles:string|number|(string|number)[]|null|undefined):boolean=>{

    if(!roles){
        return false;
    }

    if(typeof role === 'number'){
        role=role.toString();
    }

    if(role.includes('|')){
        role=role.replace(pipeReg,'_PIPE_');
    }

    if(Array.isArray(roles)){
        for(const r of roles){
            // use non-strict equality to allow strings and numbers to match
            if(r==role){
                return true;
            }
        }
        return false;
    }else{

        return (
            // use non-strict equality to allow strings and numbers to match
            role==roles ||
            (typeof roles === 'number'?roles.toString():roles).includes('|'+role+'|')
        )
    }
}
