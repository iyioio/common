import { atDotCss } from "@iyio/at-dot-css";
import { BaseLayoutProps } from "@iyio/common";

export const defaultPageColumnWidth=800;

export interface PageColumnProps
{
    columnWidth?:number|string;
    fullWidthColumn?:boolean;
    children?:any;
}

export function PageColumn({
    columnWidth=defaultPageColumnWidth,
    fullWidthColumn,
    children,
    ...props
}:PageColumnProps & BaseLayoutProps){

    if(fullWidthColumn){
        columnWidth='100%';
    }

    return (
        <div className={style.root()} style={style.vars({width:(typeof columnWidth==='number')?columnWidth+'px':columnWidth})}>

            <div className={style.column(null,null,props)}>
                {children}
            </div>

        </div>
    )

}

const style=atDotCss({name:'PageColumn',namespace:'iyio',order:'framework',css:`
    @.root{
        display:flex;
        flex-direction:column;
        align-items:center;
    }
    @.column{
        position:relative;
        display:flex;
        flex-direction:column;
        flex:1;
        width:100%;
        max-width:@@width;
    }
`});
