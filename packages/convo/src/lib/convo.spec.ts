import { ZodObject } from 'zod';
import { ConvoExecutionContext, executeConvoFunction } from './ConvoExecutionContext';
import { parseConvoCode } from './convo-parser';

const defaultPrompt=/*convo*/`
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

) -> grade (

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

    if( mt(grade.score 8) ) then (
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
    return("James is a funky monkey {{age}} years old")
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

        expect(r.messages.length).toBe(msgCount);

        return r;
    }

    it('should parse',()=>{
        parse(6,defaultPrompt);
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

        const fn=convo.messages[0]?.fn;

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
            ) -> values (
                return( add(values.valueA values.valueB) )
            )
        `);

        const fn=convo.messages[0]?.fn;

        expect(fn).not.toBeUndefined();
        if(!fn){
            return;
        }

        expect(executeConvoFunction(fn,{valueA:3,valueB:2})).toBe(5);

        expect(executeConvoFunction(fn,{valueA:90,valueB:9})).toBe(99);

    })




    it('should escape single quotes in strings',async ()=>{

        const convo=parse(1,/*convo*/`
            > testFn() -> values (
                return( 'I\\'m bob' )
            )
        `);

        const fn=convo.messages[0]?.fn;

        expect(fn).not.toBeUndefined();
        if(!fn){
            return;
        }

        expect(executeConvoFunction(fn)).toBe("I'm bob");

    })





    it('should escape double quotes in strings',async ()=>{

        const convo=parse(1,/*convo*/`
            > testFn() -> values (
                return( "in the famous word of colonel sanders \\"i'm too drunk to taste this chicken\\" " )
            )
        `);

        const fn=convo.messages[0]?.fn;

        expect(fn).not.toBeUndefined();
        if(!fn){
            return;
        }

        expect(executeConvoFunction(fn)).toBe("in the famous word of colonel sanders \"i'm too drunk to taste this chicken\" ");

    })





    it('should embed strings',async ()=>{

        const convo=parse(1,/*convo*/`
            > testFn() -> values (
                return( "1 + 1 = {{ add(1 1) }}" )
            )
        `);

        const fn=convo.messages[0]?.fn;

        expect(fn).not.toBeUndefined();
        if(!fn){
            return;
        }

        expect(executeConvoFunction(fn)).toBe("1 + 1 = 2");
    })





    it('should add compare negative numbers',async ()=>{

        const convo=parse(1,/*convo*/`
            > testFn(
                value: number
            ) -> values (
                return( eq(value -2) )
            )
        `);

        const fn=convo.messages[0]?.fn;

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
            ) -> values (
                return( eq( value , -2) );
            )
        `);

        const fn=convo.messages[0]?.fn;

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
            ) -> p (
                if(p.value) then(
                    if(p.value) then(
                        return('first')
                    )
                )
                return('last')
            )
        `);

        const fn=convo.messages[0]?.fn;

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
                if(mt(value 5)) then (
                    return('more')
                )else(
                    return('less')
                )
            )
        `);

        const fn=convo.messages[0]?.fn;

        expect(fn).not.toBeUndefined();
        if(!fn){
            return;
        }

        expect(executeConvoFunction(fn,{value:3})).toBe('less');

        expect(executeConvoFunction(fn,{value:8})).toBe('more');

    })

});

