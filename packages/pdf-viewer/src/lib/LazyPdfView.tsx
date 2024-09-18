import { BaseLayoutOuterProps } from '@iyio/common';
import { Text } from '@iyio/react-common';
import { lazy, Suspense } from 'react';
import type { PdfViewProps } from './PdfView';

const PdfView = lazy(() => import('./PdfView').then(v=>({default:v.PdfView})));

export function LazyPdfView(props:PdfViewProps & BaseLayoutOuterProps){

    return (
        <Suspense fallback={<Text sm colorMuted text="Loading PDF"/>}>
            <PdfView {...props} />
        </Suspense>
    )

}
