import { asType } from '@iyio/common';
import { ZodEnum, ZodObject } from 'zod';
import { CallbackConvoCompletionService } from './CallbackConvoCompletionService';
import { Conversation } from "./Conversation";
import { ConvoError } from './ConvoError';
import { getConvoMetadata } from './convo-lib';
import { ConvoErrorType, FlatConvoConversation } from "./convo-types";

describe('convo',()=>{

    it('should complete',async ()=>{

        let _flat:FlatConvoConversation|null=null;
        const responseText='Turn left';

        const cs=new CallbackConvoCompletionService(async f=>{
            _flat=f;
            return [{
                role:'assistant',
                content:responseText
            }];
        })

        const convo=new Conversation({completionService:cs});

        const r=await convo.completeAsync(/*convo*/`
            > system
            You are a friendly NASCAR driver.

            > user
            What do I do after going fast?
        `);

        const flat=_flat as FlatConvoConversation|null;

        expect(flat).not.toBeNull();
        expect(flat?.messages.length).toBe(2);

        expect(flat?.messages[1]?.content).toBe('What do I do after going fast?')
        expect(r.message?.content).toBe(responseText);

    })

    it('should call function',async ()=>{

        const speed=150;

        let callFn='goFast';
        let callParams:any={speed};

        const cs=new CallbackConvoCompletionService(async ()=>{
            return [{
                callFn,
                callParams
            }];
        })

        const convo=new Conversation({completionService:cs});

        let r=await convo.completeAsync(/*convo*/`
            > goFast(
                speed: number
            ) -> (
                print('SET_SPEED' speed )
                @shared
                currentSpeed=speed
            )

            > goFaster() -> (
                @shared
                newSpeed=add(currentSpeed 100)
            )

            > user
            I want to go really fast
        `);

        expect(r.exe?.sharedVars?.['currentSpeed']).toBe(speed);

        callFn='goFaster';
        callParams=undefined;
        r=await convo.completeAsync(/*convo*/`
            > user
            Go even faster
        `)

        expect(r.exe?.sharedVars?.['newSpeed']).toBe(speed+100);

        console.log('hio 👋 👋 👋 FULL convo',convo.convo);

    })

    it('should eval top level statements',async ()=>{

        const cs=new CallbackConvoCompletionService(async ()=>{
            return [{
                role:'assistant',
                content:'Bobby',
            }]
        })

        const convo=new Conversation({completionService:cs});

        const r=await convo.completeAsync(/*convo*/`
            > do
            Ricky='Bobby'

            > user
            What is Rick's last name?
        `);

        expect(r.exe?.sharedVars?.['Ricky']).toBe('Bobby');

    })

    it('should validate user defined return type',async ()=>{

        const convo=new Conversation();

        convo.append(/*convo*/`
            > do
            Stats=map(
                speed: number
                turn: string
            )

            > goFast(correct:boolean) -> Stats (
                if( correct ) then (
                    return( map(
                        speed: 150
                        turn: 'left'
                    ) )
                ) else (
                    return( map( color: 'red' ))
                )
            )
        `);

        const r=await convo.callFunctionAsync('goFast',{correct:true});


        expect(r?.speed).toBe(150);
        expect(r?.turn).toBe('left');

        try{
            await convo.callFunctionAsync('goFast',{correct:false});
            throw new Error('Return validation should have throw an error')
        }catch(ex){
            if(ex instanceof ConvoError){
                expect(ex.convoType).toBe(asType<ConvoErrorType>('invalid-return-value-type'));
            }else{
                throw ex;
            }

        }

    })

    it('should validate user defined args type',async ()=>{

        const convo=new Conversation();

        convo.append(/*convo*/`
            > do
            Stats=map(
                speed: number
                turn: string
            )

            > goFast(speed) Stats -> (
                return( speed )
            )
        `);

        const r=await convo.callFunctionAsync('goFast',{
            speed:200,
            turn:'left',
        });


        expect(r).toBe(200);

        try{
            await convo.callFunctionAsync('goFast',{slow:true});
            throw new Error('Arg validation should have throw an error')
        }catch(ex){
            if(ex instanceof ConvoError){
                expect(ex.convoType).toBe(asType<ConvoErrorType>('invalid-args'));
            }else{
                throw ex;
            }

        }

    })

    it('should validate enum',async ()=>{

        const convo=new Conversation();

        convo.append(/*convo*/`
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

        `);

        let r=await convo.callFunctionAsync('processGrade',{
            score:10,
            turn:'left',
            category:'fun'
        });
        expect(r).toBe(20);

        r=await convo.callFunctionAsync('processGrade',{
            score:10,
            turn:'left',
            category:'boring'
        });
        expect(r).toBe(5);

        try{
            await convo.callFunctionAsync('processGrade',{
                score:10,
                turn:'left',
                category:'cats'
            });
            throw new Error('Arg validation should have throw an error')
        }catch(ex){
            if(ex instanceof ConvoError){
                expect(ex.convoType).toBe(asType<ConvoErrorType>('invalid-args'));
            }else{
                throw ex;
            }

        }

    })

    it('should check type with is operator',async ()=>{

        const convo=new Conversation();

        convo.append(/*convo*/`
            > define
            Category = enum('fun' 'boring')

            Grade = map(
                score: number
                suggestions?: array(string)
                category: Category
            )

            > checkType(
                value: any
            ) -> (
                return(map(
                    isCategory:is(value Category)
                    isGrade:is(value Grade)
                    isNumber:is(value number)
                    isString:is(value string)
                ))
            )

        `);

        let r=await convo.callFunctionAsync('checkType',{value:6});
        expect(r).toEqual({
            isCategory:false,
            isGrade:false,
            isNumber:true,
            isString:false,
        })

        r=await convo.callFunctionAsync('checkType',{value:'6'});
        expect(r).toEqual({
            isCategory:false,
            isGrade:false,
            isNumber:false,
            isString:true,
        })

        r=await convo.callFunctionAsync('checkType',{value:'fun'});
        expect(r).toEqual({
            isCategory:true,
            isGrade:false,
            isNumber:false,
            isString:true,
        })

        r=await convo.callFunctionAsync('checkType',{value:{
            score:7,
            suggestions:['stay out of jail','don\'t trust a fart'],
            category:'fun'
        }});
        expect(r).toEqual({
            isCategory:false,
            isGrade:true,
            isNumber:false,
            isString:false,
        })

    })




    it('should create metadata',async ()=>{

        const convo=new Conversation();

        convo.append(/*convo*/`
            > define

            # description 0
            Category = enum('fun' 'boring')

            # description 1
            Grade = struct(
                # description 2
                score: number
                # description 3
                suggestions?: array(string)
                # description 4
                category: Category
            )

            # description 5
            > checkType(
                score
                suggestions
                category
            ) Grade -> (
                return(score)
            )

        `);
        console.log('hio 👋 👋 👋 before ----------------------------',);

        const c=await convo.completeAsync();

        console.log('hio 👋 👋 👋 SHARED VARS',c.exe?.sharedVars);

        const category=c.exe?.sharedVars['Category'];
        const grade=c.exe?.sharedVars['Grade'];

        expect(category).not.toBeUndefined();
        expect(grade).not.toBeUndefined();


        let m=0;

        let metadata=getConvoMetadata(category);
        expect(metadata?.comment).toBe(`description ${m++}`);

        metadata=getConvoMetadata(grade);
        expect(metadata?.comment).toBe(`description ${m++}`);
        expect(metadata?.properties?.['score']?.comment).toBe(`description ${m++}`);
        expect(metadata?.properties?.['suggestions']?.comment).toBe(`description ${m++}`);
        expect(metadata?.properties?.['category']?.comment).toBe(`description ${m++}`);


        m=0;
        let zod=c.exe?.getVarAsType('Category');
        expect(zod).toBeInstanceOf(ZodEnum);
        expect(zod?.description).toBe(`description ${m++}`);


        zod=c.exe?.getVarAsType('Grade');
        expect(zod).toBeInstanceOf(ZodObject);
        expect(zod?.description).toBe(`description ${m++}`);
        if(zod instanceof ZodObject){
            expect(zod.shape['score']?.description).toBe(`description ${m++}`);
            expect(zod.shape['suggestions']?.description).toBe(`description ${m++}`);
            expect(zod.shape['category']?.description).toBe(`description ${m++}`);
        }else{
            throw new Error('value Should be instance of ZodObject');
        }



    })




    it('should pipe',async ()=>{

        const convo=new Conversation();

        convo.append(/*convo*/`

            > pipeMessage() -> (
                convo << ---- #ok bill
                    > user
                    STUFF ok
                ----

                return('ok')
            )

        `);

        const r=await convo.callFunctionAsync('pipeMessage');

        expect(r).toBe('ok');

        expect(convo.convo).toContain('STUFF');

        expect(convo.convo.split('STUFF').length).toBe(3)

        console.log('hio 👋 👋 👋 PIPED',convo.convo);

    })

    it('should pipe with map',async ()=>{

        const convo=new Conversation();

        convo.append(/*convo*/`

            > pipeMessage(
                a: string
                b: string
            ) -> (
                convo << map(
                    REPLACE:add(a '_' b)
                    MESSAGE:fn(
                        return(add(b '_' a))
                    )
                ) << ----
                    > user
                    REPLACE ok MESSAGE ko
                ----

                return('ok')
            )

        `);

        const r=await convo.callFunctionAsync('pipeMessage',{a:'GO',b:'FAST'});

        console.log('hio 👋 👋 👋 PIPED',convo.convo);

        expect(r).toBe('ok');

        expect(convo.convo).toContain('GO_FAST');

        expect(convo.convo).toContain('FAST_GO');

        expect(convo.convo.split('GO_FAST').length).toBe(2);

        expect(convo.convo.split('FAST_GO').length).toBe(2);

    })

});
