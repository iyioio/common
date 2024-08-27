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

export const aryRemoveWhere=<T>(ary:T[],test:(item:T)=>boolean):boolean=>
{
    if(!ary){
        return false;
    }
    for(let i=0;i<ary.length;i++){
        if(test(ary[i] as T)){
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
        if(condition(ary[i] as T)){
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
        if(check(ary[i] as T)){
            count++
        }
    }

    return count;
}


export const arySum=<T>(ary:T[]|null|undefined,getValue:(item:T)=>number|null|undefined):number=>
{
    if(!ary || !getValue){
        return 0;
    }

    let value=0;
    for(let i=0;i<ary.length;i++){
        const v=getValue(ary[i] as T);
        if(v){
            value+=v;
        }
    }

    return value;
}

export const sortStringsCallback=(a:string,b:string)=>a.localeCompare(b);
export const sortStringsReverseCallback=(a:string,b:string)=>b.localeCompare(a);

export const aryOrderByStrings=(ary:string[])=>ary.sort(sortStringsCallback);
export const aryReverseOrderByStrings=(ary:string[])=>ary.sort(sortStringsReverseCallback);

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
    newAry.push(ary[0] as T);
    for(let i=1;i<ary.length;i++){
        const index=Math.round(Math.random()*i);
        newAry.splice(index,0,ary[i] as T);
    }
    return newAry;
}

/**
 * Returns a random value from the given array. If the array's length is 0 an error is throw.
 */
export const aryRandomValue=<T>(ary:T[]):T=>
{
    if(!ary || !ary.length){
        throw new Error('aryRandomValue requires the given array to have at lest 1 item');
    }
    return ary[Math.round(Math.random()*(ary.length-1))] as T;
}

/**
 * Returns a random value from the given array. If the array's length is 0 undefined is returned
 */
export const aryRandomValueOrUndefined=<T>(ary:T[]):T|undefined=>
{
    if(!ary || !ary.length){
        return undefined;
    }
    return ary[Math.round(Math.random()*(ary.length-1))]
}

export const arySingle=<T>(value:T[]|T):T|undefined=>{
    return Array.isArray(value)?value[0]:value;
}

export const uint32ArrayToNumberArray=(input:Uint32Array,length=input.length)=>{
    const ary:number[]=Array(length*4);
    for(let i=0;i<length;i++){
        const n=input[i] as number;
        ary[i*4]=n&255;
        ary[i*4+1]=(n>>8)&255
        ary[i*4+2]=(n>>16)&255;
        ary[i*4+3]=(n>>24)&255;
    }
    return ary;
}

export const aryMoveItems=(ary:any[],fromIndex:number,toIndex:number,count=1)=>{
    if(
        fromIndex<0 ||
        toIndex<0 ||
        count<1 ||
        fromIndex+count>ary.length ||
        toIndex>ary.length-count)
    {
        return false;
    }
    const removed=ary.splice(fromIndex,count);
    ary.splice(toIndex,0,...removed);
    return true;
}

export const aryShallowUnorderedCompare=(a:any[]|null|undefined,b:any[]|null|undefined):boolean=>{

    if(!a || !b || a.length!==b.length){
        return false;
    }

    for(const item of a){
        if(!b.includes(item)){
            return false;
        }
    }

    for(const item of b){
        if(!a.includes(item)){
            return false;
        }
    }

    return true;
}

export const aryPushUnique=<T>(ary:T[]|null|undefined,value:T):boolean=>{
    if(!ary || ary.includes(value)){
        return false;
    }
    ary.push(value);
    return true;
}

export const aryPushUniqueMany=<T>(ary:T[]|null|undefined,values:T[]):number=>{
    let count=0;
    if(!ary){
        return count;
    }
    for(let i=0;i<values.length;i++){
        const v=values[i];
        if(!ary.includes(v as any)){
            ary.push(v as any);
            count++;
        }
    }
    return count;
}

export const aryUnshiftUnique=<T>(ary:T[]|null|undefined,value:T):boolean=>{
    if(!ary || ary.includes(value)){
        return false;
    }
    ary.unshift(value);
    return true;
}

export const aryUnshiftUniqueMany=<T>(ary:T[]|null|undefined,values:T[]):number=>{
    let count=0;
    if(!ary){
        return count;
    }
    for(let i=0;i<values.length;i++){
        const v=values[i];
        if(!ary.includes(v as any)){
            ary.splice(count,0,v as any);
            count++;
        }
    }
    return count;
}

export const aryUnique=<T>(ary:T[]):T[]=>{
    const unique:T[]=[]
    for(let i=0;i<ary.length;i++){
        const item=ary[i] as T;
        if(!unique.includes(item)){
            unique.push(item)
        }
    }
    return unique;
}

export const aryUnorderedCompare=(a:any[]|null|undefined,b:any[]|null|undefined):boolean=>{
    if(!a || !b || a.length!==b.length){
        return false;
    }
    for(let i=0;i<a.length;i++){
        if(!b.includes(a[i])){
            return false;
        }
    }
    for(let i=0;i<b.length;i++){
        if(!a.includes(b[i])){
            return false;
        }
    }
    return true;
}
