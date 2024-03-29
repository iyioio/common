import { TimeInterval, deepCompare } from '@iyio/common';
import { z } from 'zod';
import { ProtoExpressionEngine } from './ProtoExpressionEngine';
import { protoMarkdownParseNodes, removeProtoMarkdownBaseIndent } from "./markdown";
import { MaxProtoExpressionEvalCountError, parseProtoExpression } from "./protogen-expression-lib";
import { ProtoEvalResult, ProtoEvalState, ProtoExpression, ProtoExpressionEngineOptions } from "./protogen-expression-types";
import { protoGetChildren } from './protogen-node';
import { InvalidProtoCallableArgsError, ProtoCallable } from './protogen-types';

const parseExp=(md:string,log?:string):ProtoExpression=>{
    const {rootNodes}=protoMarkdownParseNodes(removeProtoMarkdownBaseIndent(md));
    const node=protoGetChildren(rootNodes[0],false)[0];
    if(!node){
        throw new Error('No root node found');
    }
    const exp=parseProtoExpression({node});
    if(log){
        console.info(log+' - node',JSON.stringify(node,null,4))
        console.info(log,JSON.stringify(exp,null,4))
    }
    return exp;
}

const createEngine=(exp:ProtoExpression,engineOptions?:Partial<ProtoExpressionEngineOptions>):{exp:ProtoExpression,engine:ProtoExpressionEngine}=>{
    const engine=new ProtoExpressionEngine({
        expression:exp,
        ...(engineOptions??{}),
        context:{
            maxEvalCount:1000,
            ...(engineOptions?.context??{})
        },
    })
    return {
        exp,
        engine
    }
}

const evalAsync=async (exp:ProtoExpression,engineOptions?:Partial<ProtoExpressionEngineOptions>):Promise<ProtoEvalResult>=>{
    const {engine}=createEngine(exp,engineOptions);
    return await engine.evalAsync();
}
const completeWithResultAsync=async (
    state:ProtoEvalState,
    value:any,
    exp:ProtoExpression,
    engineOptions?:Partial<ProtoExpressionEngineOptions>,
    compareShape=false,
    handleResult?:(result:ProtoEvalResult)=>void|Promise<void>
):Promise<ProtoEvalResult>=>{
    const result=await evalAsync(exp,engineOptions);

    if(result.state!==state || (compareShape?!deepCompare(result.value,value):result.value!==value)){
        console.warn('states do not match',JSON.stringify(result,null,4));
        console.warn('expression',JSON.stringify(exp,null,4))
    }
    expect(result.state).toBe(state);
    if(compareShape){
        expect(result.value).toMatchObject(value);
    }else{
        expect(result.value).toBe(value);
    }
    await handleResult?.(result);
    return result
}

describe('markdown',()=>{

    it('Root return value',async ()=>{

        await completeWithResultAsync(
            'complete',
            'lo',
            parseExp(`
                ## Expression: expression
                - go: lo
            `)
        )
    })

    it('should return value of last sub',async ()=>{

        await completeWithResultAsync(
            'complete',
            2,
            parseExp(`
                ## Expression: expression
                - go:
                  - value1: 1
                  - value2: 2
            `)
        )
    })

    it('Invert value',async ()=>{

        await completeWithResultAsync(
            'complete',
            false,
            parseExp(`
                ## Expression: expression
                - value: !true
            `)
        )
    })

    it('should eval and to truthy',async ()=>{

        await completeWithResultAsync(
            'complete',
            'frank',
            parseExp(`
                ## Expression: expression
                - and:
                  - value1: 1
                  - value2: ok
                  - value3: frank
            `)
        )
    })

    it('should eval and to falsy',async ()=>{

        await completeWithResultAsync(
            'complete',
            0,
            parseExp(`
                ## Expression: expression
                - and:
                  - value1: 1
                  - value2: 0
                  - value3: frank
            `)
        )
    })

    it('should eval or to truthy',async ()=>{

        await completeWithResultAsync(
            'complete',
            'matt',
            parseExp(`
                ## Expression: expression
                - or:
                  - value: matt
                  - value: false
            `)
        )
    })

    it('should eval or to falsy',async ()=>{

        await completeWithResultAsync(
            'complete',
            null,
            parseExp(`
                ## Expression: expression
                - or:
                  - value: false
                  - value: 0
                  - value: null
            `)
        )
    })

    it('should return value',async ()=>{

        await completeWithResultAsync(
            'complete',
            77,
            parseExp(`
                ## Expression: expression
                - run:
                  - value: a
                  - value: b
                  - run2:
                    - value: x
                    - value: y
                    - return: 77
                    - value: z
                  - value: c
            `)
        )
    })

    it('should define vars',async ()=>{

        await completeWithResultAsync(
            'complete',
            'ok-bob',
            parseExp(`
                ## Expression: expression
                - vars:
                  - a: string
                  - b: string = ok-bob
            `)
        )
    })

    it('should define props',async ()=>{

        await completeWithResultAsync(
            'complete',
            'ok-bob',
            parseExp(`
                ## Expression: expression
                - props:
                  - a: string
                  - b: string = ok-bob
            `)
        )
    })

    it('should eval var value',async ()=>{

        await completeWithResultAsync(
            'complete',
            'ok-bob',
            parseExp(`
                ## Expression: expression
                - run:
                  - vars:
                    - b: string = ok-bob
                  - rando:
                  - value: .run.vars.b

            `)
        )
    })

    it('should set var',async ()=>{

        await completeWithResultAsync(
            'complete',
            'yo-yo',
            parseExp(`
                ## Expression: expression
                - run:
                  - vars:
                    - a:
                  - set: .run.vars.a
                    - val: yo-yo
                  - value: .run.vars.a

            `)
        )
    })

    it('should inc var',async ()=>{

        await completeWithResultAsync(
            'complete',
            3,
            parseExp(`
                ## Expression: expression
                - run:
                  - vars:
                    - a:=2
                  - inc: .run.vars.a
                  - value: .run.vars.a

            `)
        )
    })

    it('should dec var',async ()=>{

        await completeWithResultAsync(
            'complete',
            1,
            parseExp(`
                ## Expression: expression
                - run:
                  - vars:
                    - a:=2
                  - dec: .run.vars.a
                  - value: .run.vars.a

            `)
        )
    })

    it('should inc var by 5',async ()=>{

        await completeWithResultAsync(
            'complete',
            7,
            parseExp(`
                ## Expression: expression
                - run:
                  - vars:
                    - a:=2
                  - inc: .run.vars.a
                    - v: 5
                  - value: .run.vars.a

            `)
        )
    })

    it('should dec var by 6',async ()=>{

        await completeWithResultAsync(
            'complete',
            -4,
            parseExp(`
                ## Expression: expression
                - run:
                  - vars:
                    - a:=2
                  - dec: .run.vars.a
                    - v: 6
                  - value: .run.vars.a

            `)
        )
    })

    it('should inc string var',async ()=>{

        await completeWithResultAsync(
            'complete',
            'joyee',
            parseExp(`
                ## Expression: expression
                - run:
                  - vars:
                    - a:=joy
                  - inc: .run.vars.a
                    - v:ee
                  - value: .run.vars.a

            `)
        )
    })

    it('should throw error',async ()=>{

        const result=await completeWithResultAsync(
            'failed',
            undefined,
            parseExp(`
                ## Expression: expression
                - run:
                  - foo: bar
                  - throw: well-💩
                  - nope: nope

            `)
        )

        expect(result.error).toBe('well-💩');
    })

    it('should add',async ()=>{

        await completeWithResultAsync(
            'complete',
            5,
            parseExp(`
                ## Expression: expression
                - add:
                  - value: 2
                  - value: 3

            `)
        )
    })

    it('should add strings',async ()=>{

        await completeWithResultAsync(
            'complete',
            'JeffBob',
            parseExp(`
                ## Expression: expression
                - add:
                  - value:=Jeff
                  - value:=Bob

            `)
        )
    })

    it('should subtract',async ()=>{

        await completeWithResultAsync(
            'complete',
            -1,
            parseExp(`
                ## Expression: expression
                - sub:
                  - value: 2
                  - value: 3

            `)
        )
    })

    it('should multiply',async ()=>{

        await completeWithResultAsync(
            'complete',
            6,
            parseExp(`
                ## Expression: expression
                - mul:
                  - value: 2
                  - value: 3

            `)
        )
    })

    it('should divide',async ()=>{

        await completeWithResultAsync(
            'complete',
            20,
            parseExp(`
                ## Expression: expression
                - div:
                  - value: 100
                  - value: 5

            `)
        )
    })

    it('should mod',async ()=>{

        await completeWithResultAsync(
            'complete',
            1,
            parseExp(`
                ## Expression: expression
                - mod:
                  - value: 10
                  - value: 3

            `)
        )
    })

    it('should equal',async ()=>{

        await completeWithResultAsync(
            'complete',
            true,
            parseExp(`
                ## Expression: expression
                - eq:
                  - value: 10
                  - value: 10

            `)
        )
    })

    it('should not equal',async ()=>{

        await completeWithResultAsync(
            'complete',
            true,
            parseExp(`
                ## Expression: expression
                - neq:
                  - value: 10
                  - value: 15

            `)
        )
    })

    it('should not operator',async ()=>{

        await completeWithResultAsync(
            'complete',
            false,
            parseExp(`
                ## Expression: expression
                - not: true

            `)
        )
    })

    it('should less than',async ()=>{

        await completeWithResultAsync(
            'complete',
            true,
            parseExp(`
                ## Expression: expression
                - lt:
                  - value: 5
                  - value: 15

            `)
        )
    })

    it('should more than',async ()=>{

        await completeWithResultAsync(
            'complete',
            true,
            parseExp(`
                ## Expression: expression
                - mt:
                  - value: 55
                  - value: 15

            `)
        )
    })

    it('should less than equal to (less)',async ()=>{

        await completeWithResultAsync(
            'complete',
            true,
            parseExp(`
                ## Expression: expression
                - lte:
                  - value: 5
                  - value: 15

            `)
        )
    })

    it('should less than equal to (equal)',async ()=>{

        await completeWithResultAsync(
            'complete',
            true,
            parseExp(`
                ## Expression: expression
                - lte:
                  - value: 15
                  - value: 15

            `)
        )
    })

    it('should more than equal to (more)',async ()=>{

        await completeWithResultAsync(
            'complete',
            true,
            parseExp(`
                ## Expression: expression
                - mte:
                  - value: 15
                  - value: 6

            `)
        )
    })

    it('should more than equal to (equal)',async ()=>{

        await completeWithResultAsync(
            'complete',
            true,
            parseExp(`
                ## Expression: expression
                - mte:
                  - value: 30
                  - value: 30

            `)
        )
    })

    it('should bit-and',async ()=>{

        await completeWithResultAsync(
            'complete',
            4,
            parseExp(`
                ## Expression: expression
                - bit-and:
                  - value: 4
                  - value: 12

            `)
        )
    })

    it('should bit-or',async ()=>{

        await completeWithResultAsync(
            'complete',
            3,
            parseExp(`
                ## Expression: expression
                - bit-or:
                  - value: 1
                  - value: 2

            `)
        )
    })

    it('should bit-xor',async ()=>{

        await completeWithResultAsync(
            'complete',
            9,
            parseExp(`
                ## Expression: expression
                - bit-xor:
                  - value: 5
                  - value: 12

            `)
        )
    })

    it('should bit-not',async ()=>{

        await completeWithResultAsync(
            'complete',
            -6,
            parseExp(`
                ## Expression: expression
                - bit-not:
                  - value: 5

            `)
        )
    })

    it('should bit-shift-left',async ()=>{

        await completeWithResultAsync(
            'complete',
            8,
            parseExp(`
                ## Expression: expression
                - bit-shift-left:
                  - value: 4
                  - value: 1

            `)
        )
    })

    it('should bit-shift-right',async ()=>{

        await completeWithResultAsync(
            'complete',
            2,
            parseExp(`
                ## Expression: expression
                - bit-shift-right:
                  - value: 4
                  - value: 1

            `)
        )
    })

    it('should bit-shift-right',async ()=>{

        await completeWithResultAsync(
            'complete',
            2,
            parseExp(`
                ## Expression: expression
                - bit-zero-right:
                  - value: 5
                  - value: 1

            `)
        )
    })

    it('should eval if statement true',async ()=>{

        await completeWithResultAsync(
            'complete',
            'yes',
            parseExp(`
                ## Expression: expression
                - if:
                  - condition: true
                  - then:
                    - value: yes
                  - else:
                    - value: no

            `)
        )
    })

    it('should eval if statement false',async ()=>{

        await completeWithResultAsync(
            'complete',
            'no',
            parseExp(`
                ## Expression: expression
                - if:
                  - condition: false
                  - then:
                    - throw: should not enter
                  - else:
                    - value: no

            `)
        )
    })

    it('should eval if statement true inline condition',async ()=>{

        await completeWithResultAsync(
            'complete',
            'yes',
            parseExp(`
                ## Expression: expression
                - if: true
                  - then:
                    - value: yes
                  - else:
                    - value: no

            `)
        )
    })

    it('should eval if statement true inline condition',async ()=>{

        await completeWithResultAsync(
            'complete',
            'no',
            parseExp(`
                ## Expression: expression
                - if: !true
                  - then:
                    - throw: should not enter
                  - else:
                    - value: no

            `)
        )
    })

    it('should eval loop break at 5',async ()=>{

        await completeWithResultAsync(
            'complete',
            5,
            parseExp(`
                ## Expression: expression
                - run:
                  - vars:
                    - i:=0
                  - loop:
                    - noop:
                    - set: .run.vars.i
                      - add:
                        - v: .run.vars.i
                        - v: 1
                    - break:
                      - mte:
                        - v: .run.vars.i
                        - v: 5
                  - return: .run.vars.i

            `)
        )
    })

    it('should eval loop auto count to 6',async ()=>{

        await completeWithResultAsync(
            'complete',
            6,
            parseExp(`
                ## Expression: expression
                - run:
                  - vars:
                    - i:=0
                  - loop: 6
                    - set: .run.vars.i
                      - add:
                        - v: .run.vars.i
                        - v: 1
                  - return: .run.vars.i

            `)
        )
    })

    it('should eval loop with condition',async ()=>{

        await completeWithResultAsync(
            'complete',
            7,
            parseExp(`
                ## Expression: expression
                - run:
                  - vars:
                    - i:=0
                  - loop:
                    - condition:
                      - lt:
                        - v: .run.vars.i
                        - v: 7
                    - set: .run.vars.i
                      - add:
                        - v: .run.vars.i
                        - v: 1
                  - return: .run.vars.i

            `)
        )
    })

    it('should catch infinite loop',async ()=>{

        const result=await completeWithResultAsync(
            'failed',
            undefined,
            parseExp(`
                ## Expression: expression
                - run:
                  - loop: true
                    - noop:

            `)
        )

        expect(result.error).toBeInstanceOf(MaxProtoExpressionEvalCountError);
    })

    it('should pause',async ()=>{

        const result=await completeWithResultAsync(
            'paused',
            undefined,
            parseExp(`
                ## Expression: expression
                - run:
                  - pause: first-pause
                    - time: 1d

            `)
        )

        expect(result.context.resumeAfter).toEqual<TimeInterval>({days:1})
    })

    it('should pause resume',async ()=>{

        const exp=parseExp(`
            ## Expression: expression
            - run:
              - vars:
                - a:=2
              - inc: .run.vars.a
              - pause: first-pause
                - time: 1d
              - inc: .run.vars.a

        `)

        const result=await completeWithResultAsync(
            'paused',
            undefined,
            exp
        )

        expect(result.context.resumeAfter).toEqual<TimeInterval>({days:1});

        const engine=new ProtoExpressionEngine({
            context:result.context,
            expression:exp,
        });

        const result2=await engine.evalAsync();
        expect(result2.state).toBe<ProtoEvalState>('complete');
        expect(result2.value).toBe(4)

    })

    it('should invoke concat',async ()=>{

        await completeWithResultAsync(
            'complete',
            'ricky_bobby',
            parseExp(`
                ## Expression: expression
                - run:
                  - call: Concat
                    - a: ricky
                    - b: _
                    - c: bobby


            `),
            {
                callables:{
                    Concat:concatCallable
                }
            }
        )
    })

    it('should invoke add',async ()=>{



        await completeWithResultAsync(
            'complete',
            10,
            parseExp(`
                ## Expression: expression
                - run:
                  - call: Add
                    - a: 3
                    - b: 7


            `),
            {
                callables:{
                    Add:addCallable
                }
            }
        )
    })

    it('should gard against invoke with invalid args',async ()=>{

        const r=await completeWithResultAsync(
            'failed',
            undefined,
            parseExp(`
                ## Expression: expression
                - run:
                  - call: Add
                    - a: oh-no
                    - b: cats


            `),
            {
                callables:{
                    Add:addCallable
                }
            }
        )

        expect(r.error).toBeInstanceOf(InvalidProtoCallableArgsError);
    })

    it('should create a map object',async ()=>{

        await completeWithResultAsync(
            'complete',
            {
                a:1,
                b:2,
                c:'c',
            },
            parseExp(`
                ## Expression: expression
                - run:
                  - obj: (map)
                    - a: 1
                    - b: 2
                    - c: c

            `),
            undefined,
            true
        )
    })

    it('should set using tag',async ()=>{

        await completeWithResultAsync(
            'complete',
            77,
            parseExp(`
                ## Expression: expression
                - run:
                  - value: (set)
                    - a: 77

            `),
            undefined,
            false,
            result=>{
                expect(result.context.vars['run.value']).toBe(77);
            }
        )
    })

})

const concatCallable:ProtoCallable={
    name:'Concat',
    exportName:'Concat',
    package:'',
    args:[
        {
            varName:'a',
            type:'string',
            path:[]
        },
        {
            varName:'b',
            type:'string',
            path:[]
        },
        {
            varName:'c',
            type:'string',
            path:[]
        },
    ],
    argsScheme:z.object({
        a:z.string(),
        b:z.string(),
        c:z.string(),
    }),
    implementation:(a:string,b:string,c:string)=>{
        return a+b+c;
    }
}

const addCallable:ProtoCallable={
    name:'Add',
    exportName:'Add',
    package:'',
    args:[
        {
            varName:'a',
            type:'number',
            path:[]
        },
        {
            varName:'b',
            type:'number',
            path:[]
        }
    ],
    argsScheme:z.object({
        a:z.number(),
        b:z.number(),
    }),
    implementation:(a:number,b:number)=>{
        return a+b;
    }
}
