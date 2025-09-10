import { uint32ArrayToNumberArray } from "./array.js";

describe('array',()=>{

    it('convert Uint32Array',()=>{

        const fa=37;
        const fb=0;
        const fc=192;
        const fd=250;

        const ga=9;
        const gb=70;
        const gc=101;
        const gd=223;

        const max=parseInt('11111111111111111111111111111111',2);
        const   a=parseInt('11111111000000000000000000000000',2);
        const   b=parseInt('00000000111111110000000000000000',2);
        const   c=parseInt('00000000000000001111111100000000',2);
        const   d=parseInt('00000000000000000000000011111111',2);
        const   e=parseInt('00000000000000000000000000000000',2);
        const   f=fa | (fb<<8) | (fc<<16) | (fd<<24);
        const   g=ga | (gb<<8) | (gc<<16) | (gd<<24);
        expect(max).toBe(4294967295);
        expect(a).toBe(4278190080);
        expect(b).toBe(16711680);
        expect(c).toBe(65280);
        expect(d).toBe(255);
        expect(e).toBe(0);

        const srcAry=[max,a,b,c,d,e,f,g];
        const uAry=new Uint32Array(srcAry);

        const ary=uint32ArrayToNumberArray(uAry);

        expect(ary.length).toBe(srcAry.length*4);

        let i=0;

        expect(ary[i++]).toBe(255);
        expect(ary[i++]).toBe(255);
        expect(ary[i++]).toBe(255);
        expect(ary[i++]).toBe(255);

        expect(ary[i++]).toBe(0);
        expect(ary[i++]).toBe(0);
        expect(ary[i++]).toBe(0);
        expect(ary[i++]).toBe(255);

        expect(ary[i++]).toBe(0);
        expect(ary[i++]).toBe(0);
        expect(ary[i++]).toBe(255);
        expect(ary[i++]).toBe(0);

        expect(ary[i++]).toBe(0);
        expect(ary[i++]).toBe(255);
        expect(ary[i++]).toBe(0);
        expect(ary[i++]).toBe(0);

        expect(ary[i++]).toBe(255);
        expect(ary[i++]).toBe(0);
        expect(ary[i++]).toBe(0);
        expect(ary[i++]).toBe(0);

        expect(ary[i++]).toBe(0);
        expect(ary[i++]).toBe(0);
        expect(ary[i++]).toBe(0);
        expect(ary[i++]).toBe(0);

        expect(ary[i++]).toBe(fa);
        expect(ary[i++]).toBe(fb);
        expect(ary[i++]).toBe(fc);
        expect(ary[i++]).toBe(fd);

        expect(ary[i++]).toBe(ga);
        expect(ary[i++]).toBe(gb);
        expect(ary[i++]).toBe(gc);
        expect(ary[i++]).toBe(gd);


    })

});
