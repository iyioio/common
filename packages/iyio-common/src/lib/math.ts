import { Point } from "./common-types";

export const getDistanceBetweenPoints=(p1:Point,p2:Point):number=>{

    const a=Math.abs(p1.x-p2.x);
    const b=Math.abs(p1.y-p2.y);
    return Math.sqrt(a*a+b*b);
}
