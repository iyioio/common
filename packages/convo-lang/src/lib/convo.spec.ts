import { asType } from '@iyio/common';
import { ZodObject } from 'zod';
import { ConvoError } from './ConvoError';
import { ConvoExecutionContext, executeConvoFunction } from './ConvoExecutionContext';
import { parseConvoCode } from './convo-parser';
import { ConvoErrorType } from './convo-types';

const defaultPrompt=/*convo*/`

> define
Category = enum('fun' 'boring')

Grade = map(
    score: number
    suggestions?: array(string)
    category: Category
)

> processGrade(
    score
    suggestions
    category
) Grade -> number (
    if( eq(category 'fun') ) then (
        return(mul(score 2))
    ) else (
        return(div(score 2))
    )
)

    # Grades a paper
> gradePaper(

    # Score 1 to 10
    score: number

    # Email of user ) ->
    email?: string

    # The users job
    job: array(map(
        name: string
    ))

) -> (

    grade = __args

    lable1: beans.xy = 'good'
    lable?: beanx = dIt()
    lable3: bean3 = beans
    lable3: bean4 = beans.xy
    lable3: bean3 = 0.5

    map(
        name: 'jeff'
        age: 55
        items: map(
            jewels: 100
        )
    )

    saveGrade( grade )

    otherStuff(
        value: add( grade.email value2:"f" 'i\\'_bob' 77.65 .87 "I \\"links\\"" 88 )
    )

    moreStuff( undefined true false null )

    types( number string bool boolean time void )

    sendEmail(grade.email)

    gotoJob(grade.job)

    if( gt(grade.score 8) ) then (
        return('passed')
    ) elif ( lt(grade.score 3) ) then (
        return(map( score:0 message:"did not meat min grad"))
    ) else (
        log('we are moving on')
    )

    beans = 'good'

    list = array( beans 'corn' 3.14 )

    for( item in list ) do(
        log('me item is {{item}}')
    )

    getHeader(age:80)

    return('my name is slim')
)



# Returns a header system message
> local getHeader( age:number ) -> (
    return('James is a funky monkey {{age}} years old')
)

> dude
I'm okxc

> system
You are a friendly ghost. {{getHeader()}}

> user
My name is {{name}}


> call gradePaper(
    score: 1
    email: 'bob@tom.com'
    job:map( name: 'salad fingers' )
)


# end
`;


describe('convo',()=>{

    const parse=(msgCount:number,prompt:string,)=>{
        const r=parseConvoCode(prompt);

        expect(r.error).toBeUndefined();

        expect(r.result?.length).toBe(msgCount);

        return r;
    }

    it('should parse',()=>{
        parse(8,defaultPrompt);
    })



    it('should generate function scheme',async ()=>{

        const convo=parse(1,/*convo*/`

            > schemeTestFn(
                numberProp: number
                stringProp: string
                booleanProp: boolean
                timeProp: time
                voidProp: void
                nullProp: null
                undefinedProp: undefined
                mapTProp: map
                arrayTProp: array
                anyProp: any
                intProp: int
                mapProp: map(
                    stringMapProp: string
                    numberMapProp: number
                )
                arrayProp: array( string )
                arrayMapProp: array( map(
                    stringArrayMapProp: string
                    numberArrayMapProp: number
                ))
                numberPropOptional?: number
                stringPropOptional?: string
            )
        `);

        const fn=convo.result?.[0]?.fn;

        expect(fn).not.toBeUndefined();
        if(!fn){
            return;
        }

        const exe=new ConvoExecutionContext();
        const args=exe.getConvoFunctionArgsScheme(fn);

        expect(args).toBeInstanceOf(ZodObject);

        const params={
            numberProp:4.5,
            stringProp:'stuff',
            booleanProp:true,
            timeProp:Date.now(),
            voidProp:undefined,
            nullProp:null,
            undefinedProp:undefined,
            mapTProp:{},
            arrayTProp:[],
            anyProp:'foo',
            intProp:8,
            mapProp:{
                stringMapProp:'moreStuff',
                numberMapProp:77,
            },
            arrayProp:['str1','str2'],
            arrayMapProp:[{
                stringArrayMapProp:'evenMoreStuff',
                numberArrayMapProp:222,
            }],
            numberPropOptional:5 as number|undefined,
            stringPropOptional:'lastOfTheStuff' as string|undefined,
        }

        expect(args.safeParse(params).success).toBe(true);

        delete params.numberPropOptional;
        delete params.stringPropOptional;
        expect(args.safeParse(params).success).toBe(true);

        delete (params as any).numberProp;
        expect(args.safeParse(params).success).toBe(false);

        params.numberProp=7;
        expect(args.safeParse(params).success).toBe(true);

        delete (params.mapProp as any).stringMapProp;
        expect(args.safeParse(params).success).toBe(false);

        params.mapProp={
            stringMapProp:'tty',
            numberMapProp:44
        };
        expect(args.safeParse(params).success).toBe(true);

        (params.arrayMapProp as any[]).push(false);
        expect(args.safeParse(params).success).toBe(false);
    })




    it('should add numbers',async ()=>{

        const convo=parse(1,/*convo*/`
            > testFn(
                valueA: number
                valueB?: number
            ) -> (
                return( add(valueA valueB) )
            )
        `);

        const fn=convo.result?.[0]?.fn;

        expect(fn).not.toBeUndefined();
        if(!fn){
            return;
        }

        expect(executeConvoFunction(fn,{valueA:3,valueB:2})).toBe(5);

        expect(executeConvoFunction(fn,{valueA:90,valueB:9})).toBe(99);

    })




    it('should escape single quotes in strings',async ()=>{

        const convo=parse(1,/*convo*/`
            > testFn() -> (
                return( 'I\\'m bob' )
            )
        `);

        const fn=convo.result?.[0]?.fn;

        expect(fn).not.toBeUndefined();
        if(!fn){
            return;
        }

        expect(executeConvoFunction(fn)).toBe("I'm bob");

    })





    it('should escape double quotes in strings',async ()=>{

        const convo=parse(1,/*convo*/`
            > testFn() -> (
                return( "in the famous word of colonel sanders \\"i'm too drunk to taste this chicken\\" " )
            )
        `);

        const fn=convo.result?.[0]?.fn;

        expect(fn).not.toBeUndefined();
        if(!fn){
            return;
        }

        expect(executeConvoFunction(fn)).toBe("in the famous word of colonel sanders \"i'm too drunk to taste this chicken\" ");

    })





    it('should embed strings',async ()=>{

        const convo=parse(1,/*convo*/`
            > testFn() -> (
                return( '1 + 1 = {{ add(1 1) }}' )
            )
        `);

        const fn=convo.result?.[0]?.fn;

        expect(fn).not.toBeUndefined();
        if(!fn){
            return;
        }

        expect(executeConvoFunction(fn)).toBe("1 + 1 = 2");
    })

    it('should not embed double quote strings',async ()=>{

        const convo=parse(1,/*convo*/`
            > testFn() -> (
                return( "1 + 1 = {{ add(1 1) }}" )
            )
        `);

        const fn=convo.result?.[0]?.fn;

        expect(fn).not.toBeUndefined();
        if(!fn){
            return;
        }

        expect(executeConvoFunction(fn)).toBe("1 + 1 = {{ add(1 1) }}");
    })





    it('should add compare negative numbers',async ()=>{

        const convo=parse(1,/*convo*/`
            > testFn(
                value: number
            ) -> (
                return( eq(value -2) )
            )
        `);

        const fn=convo.result?.[0]?.fn;

        expect(fn).not.toBeUndefined();
        if(!fn){
            return;
        }

        expect(executeConvoFunction(fn,{value:-2})).toBe(true);

        expect(executeConvoFunction(fn,{value:2})).toBe(false);

    })





    it('should allow commas and semi-colons',async ()=>{

        const convo=parse(1,/*convo*/`
            > testFn(
                value: number
            ) -> (
                return( eq( value , -2) );
            )
        `);

        const fn=convo.result?.[0]?.fn;

        expect(fn).not.toBeUndefined();
        if(!fn){
            return;
        }

        expect(executeConvoFunction(fn,{value:-2})).toBe(true);

        expect(executeConvoFunction(fn,{value:2})).toBe(false);

    })





    it('should deep return',async ()=>{

        const convo=parse(1,/*convo*/`
            > testFn(
                value: boolean
            ) -> (
                if(value) then(
                    if(value) then(
                        return('first')
                    )
                )
                return('last')
            )
        `);

        const fn=convo.result?.[0]?.fn;

        expect(fn).not.toBeUndefined();
        if(!fn){
            return;
        }

        expect(executeConvoFunction(fn,{value:true})).toBe('first');

        expect(executeConvoFunction(fn,{value:false})).toBe('last');

    })





    it('should return based on if',async ()=>{

        const convo=parse(1,/*convo*/`
            > testFn(
                value: number
            ) -> (
                if(gt(value 5)) then (
                    return('more')
                )else(
                    return('less')
                )
            )
        `);

        const fn=convo.result?.[0]?.fn;

        expect(fn).not.toBeUndefined();
        if(!fn){
            return;
        }

        expect(executeConvoFunction(fn,{value:3})).toBe('less');

        expect(executeConvoFunction(fn,{value:8})).toBe('more');

    })





    it('should validate return type',async ()=>{

        const convo=parse(1,/*convo*/`
            > testFn(
                value: number
            ) -> string (
                if(gt(value 5)) then (
                    return('more')
                )else(
                    return(0)
                )
            )
        `);

        const fn=convo.result?.[0]?.fn;

        expect(fn).not.toBeUndefined();
        if(!fn){
            return;
        }

        expect(executeConvoFunction(fn,{value:8})).toBe('more');

        try{
            executeConvoFunction(fn,{value:3});
            throw new Error('Return validation should have throw an error')
        }catch(ex){
            if(ex instanceof ConvoError){
                expect(ex.convoType).toBe(asType<ConvoErrorType>('invalid-return-value-type'));
            }else{
                throw ex;
            }

        }

    })





    it('should validate function args',async ()=>{

        const convo=parse(1,/*convo*/`
            > testFn(
                value: number
            ) -> (
                return( value )
            )
        `);

        const fn=convo.result?.[0]?.fn;

        expect(fn).not.toBeUndefined();
        if(!fn){
            return;
        }

        expect(executeConvoFunction(fn,{value:8})).toBe(8);

        try{
            executeConvoFunction(fn,{value:'3'});
            throw new Error('Arg validation should have throw an error')
        }catch(ex){
            if(ex instanceof ConvoError){
                expect(ex.convoType).toBe(asType<ConvoErrorType>('invalid-args'));
            }else{
                throw ex;
            }

        }

    })





    it('should reference __args',async ()=>{

        const convo=parse(1,/*convo*/`
            > testFn(
                value: number
            ) -> (
                return( __args )
            )
        `);

        const fn=convo.result?.[0]?.fn;

        expect(fn).not.toBeUndefined();
        if(!fn){
            return;
        }

        expect(executeConvoFunction(fn,{value:8})).toEqual({value:8});

    })





    it('should loop using while',async ()=>{

        const convo=parse(1,/*convo*/`
            > testFn() -> (
                total = 0
                n = 0
                while( lt(n 5) ) do (
                    total = add( n total )
                    n = add( n 1 )
                )
                return(total)
            )
        `);

        const fn=convo.result?.[0]?.fn;

        expect(fn).not.toBeUndefined();
        if(!fn){
            return;
        }

        expect(executeConvoFunction(fn)).toEqual(10);

    })





    it('should loop using foreach',async ()=>{

        const convo=parse(1,/*convo*/`
            > testFn() -> (
                total = 0
                foreach( num=in(array(1 2 3)) ) do (
                    total = add( num total )
                )
                return(total)
            )
        `);

        const fn=convo.result?.[0]?.fn;

        expect(fn).not.toBeUndefined();
        if(!fn){
            return;
        }

        expect(executeConvoFunction(fn)).toEqual(6);

    })




    it('should break foreach',async ()=>{

        const convo=parse(1,/*convo*/`
            > testFn() -> (
                total = 0
                foreach( num=in(array(1 2 3 4 )) ) do (
                    if(eq(num 4)) then(
                        break()
                    )
                    total = add( num total )
                )
                return(total)
            )
        `);

        const fn=convo.result?.[0]?.fn;

        expect(fn).not.toBeUndefined();
        if(!fn){
            return;
        }

        expect(executeConvoFunction(fn)).toEqual(6);

    })




    it('should increment var',async ()=>{

        const convo=parse(1,/*convo*/`
            > testFn() -> (
                inc(total)
                inc(total 2)
                return(total)
            )
        `);

        const fn=convo.result?.[0]?.fn;

        expect(fn).not.toBeUndefined();
        if(!fn){
            return;
        }

        expect(executeConvoFunction(fn)).toEqual(3);

    })




    it('should decrement var',async ()=>{

        const convo=parse(1,/*convo*/`
            > testFn() -> (
                dec(total)
                dec(total 2)
                return(total)
            )
        `);

        const fn=convo.result?.[0]?.fn;

        expect(fn).not.toBeUndefined();
        if(!fn){
            return;
        }

        expect(executeConvoFunction(fn)).toEqual(-3);

    })




    it('should validate enum with strings and numbers',async ()=>{

        const convo=parse(1,/*convo*/`
            > testFn(
                value:enum('a' 'b' 3)
            ) -> (
                return(add(value value))
            )
        `);

        const fn=convo.result?.[0]?.fn;

        expect(fn).not.toBeUndefined();
        if(!fn){
            return;
        }

        expect(executeConvoFunction(fn,{value:'a'})).toEqual('aa');
        expect(executeConvoFunction(fn,{value:'b'})).toEqual('bb');
        expect(executeConvoFunction(fn,{value:3})).toEqual(6);

        try{
            executeConvoFunction(fn,{value:'c'});
            throw new Error('Arg validation should have throw an error')
        }catch(ex){
            if(ex instanceof ConvoError){
                expect(ex.convoType).toBe(asType<ConvoErrorType>('invalid-args'));
            }else{
                throw ex;
            }

        }

        try{
            executeConvoFunction(fn,{value:6});
            throw new Error('Arg validation should have throw an error')
        }catch(ex){
            if(ex instanceof ConvoError){
                expect(ex.convoType).toBe(asType<ConvoErrorType>('invalid-args'));
            }else{
                throw ex;
            }

        }
    })




    it('should use switch statement',async ()=>{

        const convo=parse(1,/*convo*/`
            > testFn(
                value:any
            ) -> (
                result = switch(
                    value
                    case(1) "one"
                    case(2) "two"
                )
                return(result)
            )
        `);

        const fn=convo.result?.[0]?.fn;

        expect(fn).not.toBeUndefined();
        if(!fn){
            return;
        }

        expect(executeConvoFunction(fn,{value:1})).toEqual('one');
        expect(executeConvoFunction(fn,{value:2})).toEqual('two');
        expect(executeConvoFunction(fn,{value:3})).toEqual(undefined);

    })




    it('should use switch statement with multiple switch values',async ()=>{

        const convo=parse(1,/*convo*/`
            > testFn(
                value:any
                value2:any
            ) -> (
                result = switch(

                    value
                    case(1) "one"
                    case(2) "two"

                    value2
                    case('b') "bee"
                    case('c') "sea"

                )
                return(result)
            )
        `);

        const fn=convo.result?.[0]?.fn;

        expect(fn).not.toBeUndefined();
        if(!fn){
            return;
        }

        expect(executeConvoFunction(fn,{value:1,value2:'c'})).toEqual('one');
        expect(executeConvoFunction(fn,{value:2,value2:'b'})).toEqual('two');
        expect(executeConvoFunction(fn,{value:3,value2:'c'})).toEqual('sea');
        expect(executeConvoFunction(fn,{value:4,value2:'b'})).toEqual('bee');
        expect(executeConvoFunction(fn,{value:5,value2:'z'})).toEqual(undefined);

    })




    it('should use switch statement with default',async ()=>{

        const convo=parse(1,/*convo*/`
            > testFn(
                value:any
            ) -> (
                result = switch(

                    value
                    case(1) "one"
                    case(2) "two"

                    default() "three"

                    test(true) "not possible"

                )
                return(result)
            )
        `);

        const fn=convo.result?.[0]?.fn;

        expect(fn).not.toBeUndefined();
        if(!fn){
            return;
        }

        expect(executeConvoFunction(fn,{value:1})).toEqual('one');
        expect(executeConvoFunction(fn,{value:2})).toEqual('two');
        expect(executeConvoFunction(fn,{value:3})).toEqual('three');
        expect(executeConvoFunction(fn,{value:77})).toEqual('three');

    })




    it('should use switch statement with test',async ()=>{

        const convo=parse(1,/*convo*/`
            > testFn(
                value:any
            ) -> (
                result = switch(

                    value
                    case(1) "one"
                    case(2) "two"

                    test(gt(value,10)) "more that 10"

                )
                return(result)
            )
        `);

        const fn=convo.result?.[0]?.fn;

        expect(fn).not.toBeUndefined();
        if(!fn){
            return;
        }

        expect(executeConvoFunction(fn,{value:1})).toEqual('one');
        expect(executeConvoFunction(fn,{value:2})).toEqual('two');
        expect(executeConvoFunction(fn,{value:3})).toEqual(undefined);
        expect(executeConvoFunction(fn,{value:77})).toEqual('more that 10');

    })




    it('should use switch statement as ternary',async ()=>{

        const convo=parse(1,/*convo*/`
            > testFn(
                value:any
            ) -> (
                result = switch( value "true" "false" )
                return(result)
            )
        `);

        const fn=convo.result?.[0]?.fn;

        expect(fn).not.toBeUndefined();
        if(!fn){
            return;
        }

        expect(executeConvoFunction(fn,{value:0})).toEqual('false');
        expect(executeConvoFunction(fn,{value:false})).toEqual('false');
        expect(executeConvoFunction(fn,{value:1})).toEqual('true');
        expect(executeConvoFunction(fn,{value:true})).toEqual('true');

    })

});

