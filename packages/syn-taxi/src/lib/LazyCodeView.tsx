import { FirstArg } from '@iyio/common';
import { Suspense, lazy } from 'react';

const CodeView=lazy(()=>import('./CodeView.js').then(v=>({default:v.CodeView})));

export function LazyCodeView({
    lazyFallback,
    ...props
}:FirstArg<typeof CodeView> & {lazyFallback:any}){
    return (
        <Suspense fallback={lazyFallback}>
            <CodeView {...props}/>
        </Suspense>
    )
}
