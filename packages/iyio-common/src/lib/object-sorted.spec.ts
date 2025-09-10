import { getSortedObjStrings, getSortedObjectHash, sortedObjPrefix } from "./object-sorted.js";
import { strHashBase64Fs } from "./string-hashing.js";

describe('object-sorted',()=>{

    const obj={
        z:1,
        b:"asdf",
        j:null,
        ud:undefined,
        sym:Symbol(),
        func:()=>{/* */},
        child:{
            b:'x',
            a:'ok',
            ary:[
                1,
                Symbol(),
                8,
                undefined,
                9,
                ()=>{/* */},
                {
                    n:null,
                    a:'x'
                },
                [5,6,7]
            ]
        }
    }

    it('should sort object',()=>{

        const strings=getSortedObjStrings(obj);

        const p=sortedObjPrefix;
        expect(strings).toEqual([
            p.object,

                p.key+'b',
                p.string+'asdf',

                p.key+'child',
                p.object,

                    p.key+'a',
                    p.string+'ok',

                    p.key+'ary',
                    p.array,

                        p.number+1,
                        p.symbol,
                        p.number+8,
                        p.undefined,
                        p.number+9,
                        p.function,

                        p.object,

                            p.key+'a',
                            p.string+'x',

                            p.key+'n',
                            p.null,

                        p.objectEnd,

                        p.array,
                            p.number+5,
                            p.number+6,
                            p.number+7,
                        p.arrayEnd,

                    p.arrayEnd,

                    p.key+'b',
                    p.string+'x',

                p.objectEnd,

                p.key+'j',
                p.null,

                p.key+'z',
                p.number+1,


            p.objectEnd
        ])

    })

    it('should hash object',()=>{

        const expectedHash='xkbEVoWkt6Rg2JhRCB_lYY_lOeh6NwqzBAmraqhyBmw';

        const hash=getSortedObjectHash(obj);
        const strings=getSortedObjStrings(obj);

        expect(hash).toBe(expectedHash);

        expect(strHashBase64Fs(strings.join(''))).toBe(expectedHash);

    });

})
