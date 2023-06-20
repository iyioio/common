import { aryMoveItems } from "./array";

export const objWatchAryRemove=(ary:any[],value:any,beforeRemove?:()=>void):boolean=>{
    const i=ary.indexOf(value);
    if(i===-1){
        return false;
    }
    return objWatchAryRemoveAt(ary,i,1,beforeRemove);
}

export const objWatchAryRemoveAt=(ary:any[],index:number,deleteCount:number,beforeRemove?:()=>void):boolean=>{
    if( index<0 ||
        deleteCount<1 ||
        index>=ary.length)
    {
        return false;
    }
    beforeRemove?.();
    ary.splice(index,deleteCount);
    return true;
}

export const objWatchAryInsert=(ary:any[],index:number,beforeRemove:(()=>void)|undefined,...values:any[]):boolean=>{
    return objWatchArySplice(ary,index,0,beforeRemove,...values);
}

export const objWatchArySplice=(ary:any[],index:number,deleteCount:number,beforeRemove:(()=>void)|undefined,...values:any[]):boolean=>{
    if( index<0 ||
        index>=ary.length+(values.length?1:0) ||
        (deleteCount && (index+deleteCount)>ary.length))
    {
        return false;
    }
    beforeRemove?.();
    ary.splice(index,deleteCount,...values);
    return true;
}

export const objWatchAryMove=(ary:any[],fromIndex:number,toIndex:number,count:number):boolean=>{
    return aryMoveItems(ary,fromIndex,toIndex,count);
}
