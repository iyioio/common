import { escapeRegex } from "./regex-lib";

describe('regex-lib',()=>{

    it('escape regex',()=>{

        const test=(str:string)=>{
            try{
                expect(new RegExp('^'+escapeRegex(str)+'$').test(str)).toBe(true);
            }catch(ex){
                console.error(`${str} escape failed`);
                throw ex;
            }
        }

        test('a');
        test('abc123');

        test('*');
        test('abc*');
        test('abc*123');
        test('*123');

    })

});
