import { BehaviorSubject } from "rxjs";
import { popBehaviorSubjectAry, pushBehaviorSubjectAry, pushBehaviorSubjectAryMany, removeAllBehaviorSubjectAryValue, removeAllBehaviorSubjectAryValueMany, removeBehaviorSubjectAryValue, removeBehaviorSubjectAryValueMany, shiftBehaviorSubjectAry, spliceBehaviorSubjectAry, unshiftBehaviorSubjectAry, unshiftBehaviorSubjectAryMany } from "./rxjs-array-helpers";

describe('rxjs-array-helpers',()=>{


    it('should use popBehaviorSubjectAry',()=>{
        const subject=new BehaviorSubject<any[]>([1,2,3,3,'3']);

        expect(subject.value.length).toBe(5);

        expect(popBehaviorSubjectAry(subject)).toBe('3');
        expect(subject.value).toEqual([1,2,3,3]);
    });


    it('should use shiftBehaviorSubjectAry',()=>{
        const subject=new BehaviorSubject<any[]>([1,2,3,3,'3']);

        expect(subject.value.length).toBe(5);

        expect(shiftBehaviorSubjectAry(subject)).toBe(1);
        expect(subject.value).toEqual([2,3,3,'3']);
    });


    it('should use removeBehaviorSubjectAryValue',()=>{
        const subject=new BehaviorSubject<any[]>([1,2,3,3,'3']);

        expect(subject.value.length).toBe(5);

        expect(removeBehaviorSubjectAryValue(subject,2)).toBe(true);
        expect(subject.value).toEqual([1,3,3,'3']);

        expect(removeBehaviorSubjectAryValue(subject,2)).toBe(false);
        expect(subject.value).toEqual([1,3,3,'3']);

        expect(removeBehaviorSubjectAryValue(subject,'3')).toBe(true);
        expect(subject.value).toEqual([1,3,3]);

        expect(removeBehaviorSubjectAryValue(subject,3)).toBe(true);
        expect(subject.value).toEqual([1,3]);
    });


    it('should use removeAllBehaviorSubjectAryValue',()=>{
        const subject=new BehaviorSubject<any[]>([1,2,3,3,'3']);

        expect(subject.value.length).toBe(5);

        expect(removeAllBehaviorSubjectAryValue(subject,2)).toBe(1);
        expect(subject.value).toEqual([1,3,3,'3']);

        expect(removeAllBehaviorSubjectAryValue(subject,2)).toBe(0);
        expect(subject.value).toEqual([1,3,3,'3']);

        expect(removeAllBehaviorSubjectAryValue(subject,'3')).toBe(1);
        expect(subject.value).toEqual([1,3,3]);

        expect(removeAllBehaviorSubjectAryValue(subject,3)).toBe(2);
        expect(subject.value).toEqual([1]);
    });


    it('should use removeBehaviorSubjectAryValueMany',()=>{
        const subject=new BehaviorSubject<any[]>([1,2,3,3,'3',4,8,5,4,5,'8',6,7,'8',9]);

        expect(subject.value.length).toBe(15);

        expect(removeBehaviorSubjectAryValueMany(subject,[2,77,3,'8'])).toBe(3);
        expect(subject.value).toEqual([1,3,'3',4,8,5,4,5,6,7,'8',9]);

    });


    it('should use removeAllBehaviorSubjectAryValueMany',()=>{
        const subject=new BehaviorSubject<any[]>([1,2,3,3,'3',4,8,5,4,5,'8',6,7,'8',9]);

        expect(subject.value.length).toBe(15);

        expect(removeAllBehaviorSubjectAryValueMany(subject,[2,77,3,'8'])).toBe(5);
        expect(subject.value).toEqual([1,'3',4,8,5,4,5,6,7,9]);

    });


    it('should use pushBehaviorSubjectAry',()=>{
        const subject=new BehaviorSubject<any[]>([1,'2',3,'a','b']);

        expect(subject.value.length).toBe(5);

        expect(pushBehaviorSubjectAry(subject,'z')).toBe('z');
        expect(subject.value).toEqual([1,'2',3,'a','b','z']);

    });


    it('should use pushBehaviorSubjectAryMany',()=>{
        const subject=new BehaviorSubject<any[]>([1,'2',3,'a','b']);

        expect(subject.value.length).toBe(5);

        const pushAry=['x','z','y'];
        expect(pushBehaviorSubjectAryMany(subject,pushAry)).toBe(pushAry);
        expect(pushAry).toEqual(['x','z','y'])
        expect(subject.value).toEqual([1,'2',3,'a','b','x','z','y']);

    });


    it('should use unshiftBehaviorSubjectAry',()=>{
        const subject=new BehaviorSubject<any[]>([1,'2',3,'a','b']);

        expect(subject.value.length).toBe(5);

        expect(unshiftBehaviorSubjectAry(subject,'z')).toBe('z');
        expect(subject.value).toEqual(['z',1,'2',3,'a','b']);

    });


    it('should use unshiftBehaviorSubjectAryMany',()=>{
        const subject=new BehaviorSubject<any[]>([1,'2',3,'a','b']);

        expect(subject.value.length).toBe(5);

        const unshiftAry=['x','z','y'];
        expect(unshiftBehaviorSubjectAryMany(subject,unshiftAry)).toBe(unshiftAry);
        expect(unshiftAry).toEqual(['x','z','y'])
        expect(subject.value).toEqual(['x','z','y',1,'2',3,'a','b']);

    });


    it('should use spliceBehaviorSubjectAry',()=>{
        const subject=new BehaviorSubject<any[]>([1,'2',3,'a','b']);

        expect(subject.value.length).toBe(5);

        expect(spliceBehaviorSubjectAry(subject,1,1)).toEqual(['2']);
        expect(subject.value).toEqual([1,3,'a','b']);

        expect(spliceBehaviorSubjectAry(subject,2,0)).toEqual([]);
        expect(subject.value).toEqual([1,3,'a','b']);

        expect(spliceBehaviorSubjectAry(subject,2,0,'j','k')).toEqual([]);
        expect(subject.value).toEqual([1,3,'j','k','a','b']);

        expect(spliceBehaviorSubjectAry(subject,3,2,'m','n')).toEqual(['k','a']);
        expect(subject.value).toEqual([1,3,'j','m','n','b']);

    });

});
