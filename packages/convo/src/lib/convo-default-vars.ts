import { convoArgsName, convoArrayFnName, convoBodyFnName, convoEnumFnName, convoGlobalRef, convoJsonArrayFnName, convoJsonMapFnName, convoLabeledScopeParamsToObj, convoMapFnName, convoMetadataKey, convoPipeFnName, convoStructFnName, createConvoBaseTypeDef, createConvoMetadataForStatement, createConvoScopeFunction, createConvoTypeDef, makeAnyConvoType } from "./convo-lib";
import { convoPipeScopeFunction } from "./convo-pipe";
import { ConvoIterator, ConvoScope } from "./convo-types";
import { convoValueToZodType } from "./convo-zod";

const ifFalse=Symbol();
const ifTrue=Symbol();
const breakLoop=Symbol();


const mapFn=makeAnyConvoType('map',createConvoScopeFunction({
    usesLabels:true,
},convoLabeledScopeParamsToObj))

const arrayFn=makeAnyConvoType('array',(scope:ConvoScope)=>{
    return scope.paramValues??[]
})

const and=createConvoScopeFunction({
    discardParams:true,
    nextParam(scope){
        const value=scope.paramValues?scope.paramValues[scope.paramValues.length-1]:undefined;
        if(value){
            return scope.i+1;
        }else{
            return false;
        }
    }
},scope=>{
    const value=scope.paramValues?scope.paramValues[scope.paramValues.length-1]:undefined;
    return value?true:false
})

export const defaultConvoVars={

    [convoBodyFnName]:createConvoScopeFunction({
        discardParams:true,
        catchReturn:true,
    }),

    string:createConvoBaseTypeDef('string'),
    number:createConvoBaseTypeDef('number'),
    int:createConvoBaseTypeDef('int'),
    time:createConvoBaseTypeDef('time'),
    void:createConvoBaseTypeDef('void'),
    boolean:createConvoBaseTypeDef('boolean'),
    any:createConvoBaseTypeDef('any'),

    ['true']:true,
    ['false']:false,
    ['null']:null,
    ['undefined']:undefined,
    [convoGlobalRef]:undefined,

    [convoPipeFnName]:convoPipeScopeFunction,

    [convoStructFnName]:makeAnyConvoType('map',createConvoScopeFunction({
        usesLabels:true,
    },(scope)=>{
        scope.cm=true;
        return convoLabeledScopeParamsToObj(scope);
    })),
    [convoMapFnName]:mapFn,
    [convoArrayFnName]:arrayFn,
    [convoJsonMapFnName]:mapFn,
    [convoJsonArrayFnName]:arrayFn,
    [convoArgsName]:undefined,

    [convoEnumFnName]:createConvoScopeFunction(scope=>{
        const type=createConvoTypeDef({
            type:'enum',
            enumValues:scope.paramValues??[],
        })
        const metadata=createConvoMetadataForStatement(scope.s);
        (type as any)[convoMetadataKey]=metadata;
        return type;
    }),
    is:createConvoScopeFunction(scope=>{
        if(!scope.paramValues || scope.paramValues.length<2){
            return false;
        }
        const type=scope.paramValues[scope.paramValues.length-1];
        if(!type || (typeof type !== 'object')){
            return false;
        }

        const scheme=convoValueToZodType(type);

        for(let i=0;i<scope.paramValues.length-1;i++){
            const p=scheme.safeParse(scope.paramValues[i]);
            if(!p.success){
                return false;
            }
        }
        return true;
    }),
    and:and,
    or:createConvoScopeFunction(scope=>{
        if(!scope.paramValues?.length){
            return false;
        }
        for(let i=0;i<scope.paramValues.length;i++){
            if(scope.paramValues[i]){
                return true;
            }
        }
        return false;
    }),
    not:createConvoScopeFunction(scope=>{
        if(!scope.paramValues?.length){
            return true;
        }
        for(let i=0;i<scope.paramValues.length;i++){
            if(scope.paramValues[i]){
                return false;
            }
        }
        return true;
    }),

    if:createConvoScopeFunction({
        discardParams:true,
        nextParam(scope,parentScope){
            const value=scope.paramValues?scope.paramValues[scope.paramValues.length-1]:undefined;
            if(value){
                return scope.i+1;
            }else{
                if(parentScope){
                    parentScope.i++;
                }
                return false;
            }
        }
    },(scope)=>{
        const value=scope.paramValues?scope.paramValues[scope.paramValues.length-1]:undefined;
        return value?ifTrue:ifFalse;
    }),

    elif:createConvoScopeFunction({
        discardParams:true,
        shouldExecute(scope,parentScope){
            const prev=(parentScope?.paramValues && parentScope.paramValues[parentScope.paramValues.length-1]);
            return prev===ifFalse;
        },
        nextParam(scope){
            const value=scope.paramValues?scope.paramValues[scope.paramValues.length-1]:undefined;
            if(value){
                return scope.i+1;
            }else{
                return false;
            }
        }
    },scope=>{
        const value=scope.paramValues?scope.paramValues[scope.paramValues.length-1]:undefined;
        return value?ifTrue:ifFalse;
    }),

    else:createConvoScopeFunction({
        discardParams:true,
        shouldExecute(scope,parentScope){
            const prev=(parentScope?.paramValues && parentScope.paramValues[parentScope.paramValues.length-1]);
            return prev===ifFalse;
        },
    },()=>{
        return ifTrue;
    }),

    then:createConvoScopeFunction({
        discardParams:true,
        shouldExecute(scope,parentScope){
            const prev=(parentScope?.paramValues && parentScope.paramValues[parentScope.paramValues.length-1]);
            return prev===ifTrue;
        },
    },()=>{
        return ifTrue;
    }),

    while:createConvoScopeFunction({
        discardParams:true,
        nextParam(scope,parentScope){
            const value=scope.paramValues?scope.paramValues[scope.paramValues.length-1]:undefined;
            if(scope.i===0 && parentScope){
                delete parentScope.fromIndex;
            }
            if(scope.s.params && scope.i===scope.s.params.length-1 && parentScope){
                if(value){
                    parentScope.fromIndex=parentScope.i+1;
                    parentScope.gotoIndex=parentScope.i;
                    parentScope.li=parentScope.i+1;
                }
            }
            if(value){
                return scope.i+1;
            }else{
                if(parentScope){
                    parentScope.i++;
                }
                return false;
            }
        }
    },(scope)=>{
        const value=scope.paramValues?scope.paramValues[scope.paramValues.length-1]:undefined;
        if(value){
            scope.ctrlData=ifTrue;
        }
        return scope.ctrlData??ifFalse;
    }),

    foreach:createConvoScopeFunction({
        discardParams:true,
        keepData:true,
        startParam(scope,parentScope){
            if(!scope.s.params?.length){
                if(parentScope){
                    parentScope.i++;
                }
                return false;
            }
            return 0;
        },
        nextParam(scope,parentScope){
            console.log('hio 👋 👋 👋 foreach loop',scope.paramValues);
            if(scope.paramValues?.[0]===breakLoop){
                if(parentScope){
                    parentScope.i++;
                }
                return false;
            }
            if(parentScope && scope.i+1===scope.s.params?.length){
                parentScope.fromIndex=parentScope.i+1;
                parentScope.gotoIndex=parentScope.i;
                parentScope.li=parentScope.i+1;
            }
            return scope.i+1;
        }
    },(scope)=>{
        const value=scope.paramValues?scope.paramValues[scope.paramValues.length-1]:undefined;
        if(value){
            scope.ctrlData=ifTrue;
        }
        return scope.ctrlData??ifFalse;
    }),

    in:createConvoScopeFunction({
        discardParams:true,
        keepData:true,
        nextParam(scope){

            const value=scope.paramValues?.[0];

            if(!value || (typeof value !== 'object')){
                return false;
            }
            let it:ConvoIterator=scope.ctrlData;
            if(!it){
                it={i:0}
                if(!Array.isArray(value)){
                    it.keys=Object.keys(value);
                }
                scope.ctrlData=it;
            }

            return false;
        }
    },(scope)=>{
        const it=scope.ctrlData as ConvoIterator|undefined;
        if(!it){
            return breakLoop;
        }

        const value=scope.paramValues?.[0];
        const isArray=Array.isArray(value);
        const ary:any[]=it.keys??value;

        console.log('hio 👋 👋 👋 in value',it,value,ary);

        if(it.i>=ary.length){
            return breakLoop;
        }

        const r=isArray?value[it.i]:{key:ary[it.i],value:value[ary[it.i]]};
        it.i++;

        return r;

    }),

    break:createConvoScopeFunction((scope)=>{
        if(!scope.paramValues?.length){
            scope.bl=true;
            return undefined;
        }
        for(let i=0;i<scope.paramValues.length;i++){
            if(scope.paramValues[i]){
                scope.bl=true;
                return undefined;
            }
        }
        return undefined;
    }),

    do:createConvoScopeFunction({
        discardParams:true,
    },scope=>{
        return scope.paramValues?scope.paramValues[scope.paramValues.length-1]:undefined;
    }),

    return:createConvoScopeFunction(scope=>{
        const value=scope.paramValues?scope.paramValues[scope.paramValues.length-1]:undefined;
        scope.r=true;
        return value;
    }),

    eq:createConvoScopeFunction(scope=>{
        if(!scope.paramValues || scope.paramValues.length<2){
            return false;
        }
        for(let i=1;i<scope.paramValues.length;i++){
            if(scope.paramValues[i-1]!==scope.paramValues[i]){
                return false;
            }
        }
        return true;
    }),

    gt:createConvoScopeFunction(scope=>{
        if(!scope.paramValues || scope.paramValues.length<2){
            return false;
        }
        for(let i=1;i<scope.paramValues.length;i++){
            if(!(scope.paramValues[i-1]>scope.paramValues[i])){
                return false;
            }
        }
        return true;
    }),

    gte:createConvoScopeFunction(scope=>{
        if(!scope.paramValues || scope.paramValues.length<2){
            return false;
        }
        for(let i=1;i<scope.paramValues.length;i++){
            if(!(scope.paramValues[i-1]>=scope.paramValues[i])){
                return false;
            }
        }
        return true;
    }),

    lt:createConvoScopeFunction(scope=>{
        if(!scope.paramValues || scope.paramValues.length<2){
            return false;
        }
        for(let i=1;i<scope.paramValues.length;i++){
            if(!(scope.paramValues[i-1]<scope.paramValues[i])){
                return false;
            }
        }
        return true;
    }),

    lte:createConvoScopeFunction(scope=>{
        if(!scope.paramValues || scope.paramValues.length<2){
            return false;
        }
        for(let i=1;i<scope.paramValues.length;i++){
            if(!(scope.paramValues[i-1]<=scope.paramValues[i])){
                return false;
            }
        }
        return true;
    }),

    add:createConvoScopeFunction(scope=>{
        if(!scope.paramValues?.length){
            return undefined;
        }
        let value=scope.paramValues[0];
        for(let i=1;i<scope.paramValues.length;i++){
            const v=scope.paramValues[i];
            if(v!==undefined){
                if(value===undefined){
                    value=v;
                }else{
                    value+=v;
                }
            }
        }
        return value;
    }),

    sub:createConvoScopeFunction(scope=>{
        if(!scope.paramValues?.length){
            return undefined;
        }
        let value=scope.paramValues[0];
        for(let i=1;i<scope.paramValues.length;i++){
            const v=scope.paramValues[i];
            if(v!==undefined){
                if(value===undefined){
                    value=v;
                }else{
                    value-=v;
                }
            }
        }
        return value;
    }),

    mul:createConvoScopeFunction(scope=>{
        if(!scope.paramValues?.length){
            return undefined;
        }
        let value=scope.paramValues[0];
        for(let i=1;i<scope.paramValues.length;i++){
            const v=scope.paramValues[i];
            if(v!==undefined){
                if(value===undefined){
                    value=v;
                }else{
                    value*=v;
                }
            }
        }
        return value;
    }),

    div:createConvoScopeFunction(scope=>{
        if(!scope.paramValues?.length){
            return undefined;
        }
        let value=scope.paramValues[0];
        for(let i=1;i<scope.paramValues.length;i++){
            const v=scope.paramValues[i];
            if(v!==undefined){
                if(value===undefined){
                    value=v;
                }else{
                    value/=v;
                }
            }
        }
        return value;
    }),

    mod:createConvoScopeFunction(scope=>{
        if(!scope.paramValues?.length){
            return undefined;
        }
        let value=scope.paramValues[0];
        for(let i=1;i<scope.paramValues.length;i++){
            const v=scope.paramValues[i];
            if(v!==undefined){
                if(value===undefined){
                    value=v;
                }else{
                    value%=v;
                }
            }
        }
        return value;
    }),

    pow:createConvoScopeFunction(scope=>{
        if(!scope.paramValues?.length){
            return undefined;
        }
        let value=scope.paramValues[0];
        for(let i=1;i<scope.paramValues.length;i++){
            const v=scope.paramValues[i];
            if(v!==undefined){
                if(value===undefined){
                    value=v;
                }else{
                    value=Math.pow(value,v);
                }
            }
        }
        return value;
    }),

    print:createConvoScopeFunction((scope,ctx)=>{
        if(scope.paramValues){
            ctx.print(...scope.paramValues);
        }
        return scope.paramValues?.[scope.paramValues?.length??0];
    }),

    inc:createConvoScopeFunction({
        discardParams:true,
        startParam(){
            return 1;
        }
    },(scope,ctx)=>{
        if(!scope.s.params){
            return undefined;
        }
        const value=scope.paramValues?.[0]??1;
        let lastValue=value;
        const s=scope.s.params[0];
        const sv=ctx.getRefValue(s,scope,false);
        lastValue=sv===undefined?value:sv+value;
        ctx.setRefValue(s,lastValue,scope);

        return lastValue;
    }),

    dec:createConvoScopeFunction({
        discardParams:true,
        startParam(){
            return 1;
        }
    },(scope,ctx)=>{
        if(!scope.s.params){
            return undefined;
        }
        const value=scope.paramValues?.[0]??1;
        let lastValue=value;
        const s=scope.s.params[0];
        const sv=ctx.getRefValue(s,scope,false);
        lastValue=sv===undefined?-value:sv-value;
        ctx.setRefValue(s,lastValue,scope);

        return lastValue;
    }),

} as const;

Object.freeze(defaultConvoVars);

/*convo*/`
> meFn()->(
    map(
        name: string
        jeff: fart
    )

    while( true
        callHome()
        eatCheese()
    )

    if()
    then()
    else()
    elif()
    do()
    in()#
    while()#
    return()

    true
    false
    null
    undefined

    string
    number
    boolean
    time
    void

    eq()
    lt()
    lte()
    gt()
    gte()

    and()
    or()

    add()
    sub()
    mul()
    div()
    not()
    mod()
    pow()

    queue(@teaTime)


)
`;

