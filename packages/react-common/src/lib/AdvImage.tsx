import { LazyImage, LazyImageProps } from "./LazyImage";

export interface AdvImageProps extends Omit<LazyImageProps,'notLazy'>
{

    lazy?:boolean;
}

export function AdvImage({
    lazy,
    ...props
}:AdvImageProps){

    return (
        <LazyImage {...props} notLazy={!lazy} />
    )

}
