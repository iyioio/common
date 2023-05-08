const formatNumberWithBasesSteps=[
    {v:1000000000,div:1000000000,desc:10,unit:'B'},
    {v:100000000,div:1000000,desc:10,unit:'M'},
    {v:10000000,div:1000000,desc:10,unit:'M'},
    {v:1000000,div:1000000,desc:10,unit:'M'},
    {v:100000,div:1000,desc:10,unit:'K'},
    {v:10000,div:1000,desc:10,unit:'K'},
]
export const formatNumberWithBases=(n:number,desc=10):string=>{
    let unit:string='';

    for(const f of formatNumberWithBasesSteps){
        if(n>=f.v){
            unit=f.unit;
            desc=f.desc;
            n/=f.div;
            break;
        }
    }

    n=Math.round(n*desc)/desc;
    return n.toLocaleString()+unit;
}

export const safeParseNumber=(value:any,fallback=0):number=>{
    if(value===undefined || value===null){
        return fallback;
    }
    const num=Number(value);
    return isFinite(num)?num:fallback;
}

export const safeParseNumberOrUndefined=(value:any):number|undefined=>{
    if(value===undefined || value===null){
        return undefined;
    }
    const num=Number(value);
    return isFinite(num)?num:undefined;
}
