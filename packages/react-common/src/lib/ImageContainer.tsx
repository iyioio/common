import { atDotCss } from "@iyio/at-dot-css";
import { BaseLayoutProps, bcn } from "@iyio/common";

export interface ImageContainerProps extends BaseLayoutProps
{
    alt:string;
    src:string;
    fill?:boolean|'width'|'height';
}

export function ImageContainer({
    alt,
    src,
    fill="width",
    ...props
}:ImageContainerProps){
    style.root();
    return (
        <div className={bcn(props,"ImageContainer",fill===true?'fill':fill===false?null:'fill-'+fill)}>
            <img src={src} alt={alt} />
        </div>
    )

}

const style=atDotCss({name:'ImageContainer',order:'frameworkHigh',css:`
    .ImageContainer.fill img{
        width:100%;
        height:100%;
    }
    .ImageContainer.fill-height img{
        height:100%;
    }
    .ImageContainer.fill-width img{
        width:100%;
    }
`});
