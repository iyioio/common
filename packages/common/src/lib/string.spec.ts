import { splitStringWithQuotes } from "./string";

describe('strings',()=>{

    it('split with quotes',()=>{

        expect(splitStringWithQuotes(
            'abc , "1,2,3" , xyz',
            {
                separator:',',
                trimValues:false,
                escapeStyle:'backslash',
                removeEmptyValues:false,
                keepQuotes:false,
            }
        )).toEqual(
            ['abc ',' 1,2,3 ',' xyz']
        )

        expect(splitStringWithQuotes(
            'abc, "1,2,3", xyz',
            {
                separator:',',
                trimValues:false,
                escapeStyle:'backslash',
                removeEmptyValues:false,
                keepQuotes:false,
            }
        )).toEqual(
            ['abc',' 1,2,3',' xyz']
        )

        expect(splitStringWithQuotes(
            'abc, "1,2,3", xyz',
            {
                separator:',',
                trimValues:true,
                escapeStyle:'backslash',
                removeEmptyValues:false,
                keepQuotes:false,
            }
        )).toEqual(
            ['abc','1,2,3','xyz']
        )

        expect(splitStringWithQuotes(
            'abc, "1,2,3",, , xyz',
            {
                separator:',',
                trimValues:false,
                escapeStyle:'backslash',
                removeEmptyValues:false,
                keepQuotes:false,
            }
        )).toEqual(
            ['abc',' 1,2,3','',' ',' xyz']
        )

        expect(splitStringWithQuotes(
            'abc, "1,2,3",, , xyz',
            {
                separator:',',
                trimValues:true,
                escapeStyle:'backslash',
                removeEmptyValues:false,
                keepQuotes:false,
            }
        )).toEqual(
            ['abc','1,2,3','','','xyz']
        )

        expect(splitStringWithQuotes(
            'abc, "1,2,3",, , xyz',
            {
                separator:',',
                trimValues:true,
                escapeStyle:'backslash',
                removeEmptyValues:true,
                keepQuotes:false,
            }
        )).toEqual(
            ['abc','1,2,3','xyz']
        )

        expect(splitStringWithQuotes(
            'abc, "1,2,3",, , xyz',
            {
                separator:',',
                trimValues:false,
                escapeStyle:'backslash',
                removeEmptyValues:true,
                keepQuotes:false,
            }
        )).toEqual(
            ['abc',' 1,2,3',' ',' xyz']
        )

        expect(splitStringWithQuotes(
            'abc , "1,2,3" , xyz',
            {
                separator:',',
                trimValues:false,
                escapeStyle:'backslash',
                removeEmptyValues:false,
                keepQuotes:true,
            }
        )).toEqual(
            ['abc ',' "1,2,3" ',' xyz']
        )

        expect(splitStringWithQuotes(
            'abc , "1,\\"2,3\\"" , xyz',
            {
                separator:',',
                trimValues:false,
                escapeStyle:'backslash',
                removeEmptyValues:false,
                keepQuotes:false,
            }
        )).toEqual(
            ['abc ',' 1,"2,3" ',' xyz']
        )

        expect(splitStringWithQuotes(
            'abc , "1,""2,3""" , xyz',
            {
                separator:',',
                trimValues:false,
                escapeStyle:'double-quote',
                removeEmptyValues:false,
                keepQuotes:false,
            }
        )).toEqual(
            ['abc ',' 1,"2,3" ',' xyz']
        )

        expect(splitStringWithQuotes(
            "abc , '1,\\'2,3\\'' , xyz",
            {
                separator:',',
                trimValues:false,
                escapeStyle:'backslash',
                removeEmptyValues:false,
                keepQuotes:false,
            }
        )).toEqual(
            ['abc '," 1,'2,3' ",' xyz']
        )

        expect(splitStringWithQuotes(
            "abc , '1,''2,3''' , xyz",
            {
                separator:',',
                trimValues:false,
                escapeStyle:"double-quote",
                removeEmptyValues:false,
                keepQuotes:false,
            }
        )).toEqual(
            ['abc '," 1,'2,3' ",' xyz']
        )

        expect(splitStringWithQuotes(
            "abc , '1,''2,3''' , xyz",
            {
                separator:',',
                trimValues:false,
                escapeStyle:"double-quote",
                removeEmptyValues:false,
                keepQuotes:true,
            }
        )).toEqual(
            ['abc '," '1,'2,3'' ",' xyz']
        )

    });
});
