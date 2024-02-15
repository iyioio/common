import { Point, Rect, Sides } from "./common-types";

export const getDistanceBetweenPoints=(p1:Point,p2:Point):number=>{

    const a=Math.abs(p1.x-p2.x);
    const b=Math.abs(p1.y-p2.y);
    return Math.sqrt(a*a+b*b);
}

export const isPointInRectN=(
    pt:Point,
    rectLeft:number,
    rectRight:number,
    rectTop:number,
    rectBottom:number,
):boolean=>{
    return (
        pt.x>=rectLeft &&
        pt.x<=rectRight &&
        pt.y>=rectTop &&
        pt.y<=rectBottom
    )
}


export const isPointInSides=(
    pt:Point,
    rect:Sides
):boolean=>{
    return (
        pt.x>=rect.left &&
        pt.x<=rect.right &&
        pt.y>=rect.top &&
        pt.y<=rect.bottom
    )
}


export const isPointInRect=(
    pt:Point,
    rect:Rect
):boolean=>{
    return (
        pt.x>=rect.x &&
        pt.x<=rect.y &&
        pt.y>=rect.x+rect.width &&
        pt.y<=rect.y+rect.height
    )
}

export const doSidesIntersect=(
    a:Sides,
    b:Sides
):boolean=>{

    if(a.right<b.left || a.left>b.right || a.bottom<b.top || a.top>b.bottom){
        return false;
    }else{
        return true;
    }
}
