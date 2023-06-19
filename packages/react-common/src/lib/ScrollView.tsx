import { cn } from "@iyio/common";
import Style from "styled-jsx/style";
import { View, ViewProps } from "./View";

export type ScrollViewDirection='y'|'x'|'both';

export interface ScrollViewProps extends ViewProps
{
    containerProps?:ViewProps;
    children?:any;
    direction?:ScrollViewDirection;
}

export function ScrollView({
    children,
    containerProps,
    className,
    direction='y',
    row,
    col,
    ...props
}:ScrollViewProps){

    return (
        <View className={cn("ScrollView",'scroll-'+direction,className)} {...props}>

            <div>
                <View row={row} col={col} {...containerProps}>
                    {children}
                </View>
            </div>

            <Style global id="ScrollView-bmpfMZwFK7GneUZQ73Fn" jsx>{`
                .ScrollView{
                    position:relative;
                }
                .ScrollView.scroll-y > div{
                    position:absolute;
                    left:0;
                    right:0;
                    top:0;
                    bottom:0;
                }
                .ScrollView.scroll-y > div{
                    overflow-x:hidden;
                    overflow-x:clip;
                    overflow-y:auto;
                    overflow-y:overlay;
                }
                .ScrollView.scroll-x > div{
                    overflow-x:hidden;
                    overflow-x:clip;
                    overflow-y:auto;
                    overflow-y:overlay;
                }
                .ScrollView.scroll-both > div{
                    overflow-x:auto;
                    overflow-y:overlay;
                    overflow-y:auto;
                    overflow-y:overlay;
                }
            `}</Style>
        </View>
    )

}
