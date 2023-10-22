import { FirstArg } from '@iyio/common';
import { Suspense, lazy } from 'react';

const CodeInput=lazy(()=>import('./CodeInput').then(v=>({default:v.CodeInput})));

export function LazyCodeInput({
    lazyFallback,
    ...props
}:FirstArg<typeof CodeInput> & {lazyFallback?:any}){
    return (
        <Suspense fallback={lazyFallback}>
            <CodeInput {...props}/>
        </Suspense>
    )
}
