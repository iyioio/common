import { setIndentation } from "./code-parsing.js"

describe('code-parsing',()=>{

    it('should set indentation',()=>{

        const ind0=
`const fn=()=>{
    const a=1;
    const b=1;
    return a+b;
}`

        const ind1=
`    const fn=()=>{
        const a=1;
        const b=1;
        return a+b;
    }`

        const ind2=
`        const fn=()=>{
            const a=1;
            const b=1;
            return a+b;
        }`

        const ind3=
`            const fn=()=>{
                const a=1;
                const b=1;
                return a+b;
            }`


        const tabSize=4;

        expect(setIndentation(0*tabSize,ind0)).toBe(ind0);
        expect(setIndentation(1*tabSize,ind0)).toBe(ind1);
        expect(setIndentation(2*tabSize,ind0)).toBe(ind2);
        expect(setIndentation(3*tabSize,ind0)).toBe(ind3);

        expect(setIndentation(0*tabSize,ind1)).toBe(ind0);
        expect(setIndentation(1*tabSize,ind1)).toBe(ind1);
        expect(setIndentation(2*tabSize,ind1)).toBe(ind2);
        expect(setIndentation(3*tabSize,ind1)).toBe(ind3);

        expect(setIndentation(0*tabSize,ind2)).toBe(ind0);
        expect(setIndentation(1*tabSize,ind2)).toBe(ind1);
        expect(setIndentation(2*tabSize,ind2)).toBe(ind2);
        expect(setIndentation(3*tabSize,ind2)).toBe(ind3);

        expect(setIndentation(0*tabSize,ind3)).toBe(ind0);
        expect(setIndentation(1*tabSize,ind3)).toBe(ind1);
        expect(setIndentation(2*tabSize,ind3)).toBe(ind2);
        expect(setIndentation(3*tabSize,ind3)).toBe(ind3);
    })

    it('should set indentation with incurrent source indentation',()=>{

        const ind0=
`const fn=()=>{
    const a=1;
    const b=1;
    return a+b;
}`

        const ind1=
`    const fn=()=>{
        const a=1;
        const b=1;
return a+b;
    }`

        const ind2=
`        const fn=()=>{
            const a=1;
            const b=1;
            return a+b;
        }`

        const ind3=
`            const fn=()=>{
                const a=1;
                const b=1;
                return a+b;
            }`


        const tabSize=4;

        let src:string;
        let exp:string;

        src=
`    const fn=()=>{
        const a=1;
        const b=1;
return a+b;
    }`

        exp=
`        const fn=()=>{
            const a=1;
            const b=1;
    return a+b;
        }`

        expect(setIndentation(2*tabSize,src)).toBe(exp);




        src=
`            const fn=()=>{
                const a=1;
                const b=1;
  return a+b;
            }`

        exp=
`const fn=()=>{
    const a=1;
    const b=1;
return a+b;
}`

        expect(setIndentation(0*tabSize,src)).toBe(exp);
    })

})
