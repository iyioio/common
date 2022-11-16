export const aryRemoveItem=<T>(ary:T[],item:T):boolean=>
{
    if(!ary){
        return false;
    }
    for(let i=0;i<ary.length;i++){
        if(ary[i]===item){
            ary.splice(i,1);
            return true;
        }
    }
    return false;
}

export const aryRemoveFirst=<T>(ary:T[],condition:(item:T)=>boolean):boolean=>
{
    if(!ary){
        return false;
    }
    for(let i=0;i<ary.length;i++){
        if(condition(ary[i])){
            ary.splice(i,1);
            return true;
        }
    }
    return false;
}

export const aryRemoveAll=<T>(ary:T[],item:T):number=>
{
    if(!ary){
        return 0;
    }
    let n=0;
    for(let i=0;i<ary.length;i++){
        if(ary[i]===item){
            ary.splice(i,1);
            n++;
        }
    }
    return n;
}

export const aryDuplicateRemoveItem=<T>(ary:T[],item:T):T[]=>
{
    if(!ary){
        return [];
    }
    ary=[...ary];
    for(let i=0;i<ary.length;i++){
        if(ary[i]===item){
            ary.splice(i,1);
            return ary;
        }
    }
    return ary;
}



export const asArray=<T>(value:T[]|T): T extends undefined ? undefined : T[] =>
{
    if(!value){
        return undefined as any;
    }
    if(Array.isArray(value)){
        return value as any;
    }else{
        return [value] as any;
    }
}

export const asArrayItem=<T>(value:T[]|T): T extends undefined ? undefined : T|undefined =>
{
    if(!value){
        return undefined as any;
    }
    if(Array.isArray(value)){
        return value[0] as any;
    }else{
        return value as any;
    }
}


export const aryCount=<T>(ary:T[]|null|undefined,check:((item:T)=>boolean|null|undefined)|null|undefined):number=>
{
    if(!ary || !check){
        return 0;
    }

    let count=0;
    for(let i=0;i<ary.length;i++){
        if(check(ary[i])){
            count++
        }
    }

    return count;
}

export const sortNumbersCallback=(a:number,b:number)=>a-b;
export const sortNumbersReverseCallback=(a:number,b:number)=>b-a;

export const aryOrderByNumbers=(ary:number[])=>ary.sort(sortNumbersCallback);
export const aryReverseOrderByNumbers=(ary:number[])=>ary.sort(sortNumbersReverseCallback);

export const aryOrderBy=<T>(ary:T[],selectCompareValue:(item:T)=>number)=>
{
    if(!ary || !selectCompareValue)
        return;

    ary.sort((a,b)=>selectCompareValue(a)-selectCompareValue(b));
}

export const aryOrderByStr=<T>(ary:T[],selectCompareValue:(item:T)=>string)=>
{
    if(!ary || !selectCompareValue)
        return;

    ary.sort((a,b)=>(selectCompareValue(a)||'').localeCompare(selectCompareValue(b)||''));
}

export const aryReverseOrderBy=<T>(ary:T[],selectCompareValue:(item:T)=>number)=>
{
    if(!ary || !selectCompareValue)
        return;

    ary.sort((a,b)=>selectCompareValue(b)-selectCompareValue(a));
}

export const aryReverseOrderByStr=<T>(ary:T[],selectCompareValue:(item:T)=>string)=>
{
    if(!ary || !selectCompareValue)
        return;

    ary.sort((a,b)=>(selectCompareValue(b)||'').localeCompare(selectCompareValue(a)||''));
}

export const aryRandomize=<T>(ary:T[]):T[]=>
{
    const newAry:T[]=[];
    if(!ary || !ary.length){
        return newAry;
    }
    newAry.push(ary[0]);
    for(let i=1;i<ary.length;i++){
        const index=Math.round(Math.random()*i);
        newAry.splice(index,0,ary[i]);
    }
    return newAry;
}
