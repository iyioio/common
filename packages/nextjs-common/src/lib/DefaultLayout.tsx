import { atDotCss } from "@iyio/at-dot-css";
import { cn, RouteInfo } from "@iyio/common";
import { AnimatedPageTransition, PageTransitionOptions } from "@iyio/react-common";
import { FunctionComponent } from "react";

export interface DefaultLayoutProps
{
    routeInfo:RouteInfo;
    className?:string;
    unstyled?:boolean;
    pageTransitions?:boolean|PageTransitionOptions;
    before?:any;
    after?:any;
    children?:any;

    /**
     * Wraps all content in the layout including page transitions
     */
    LayoutWrapper?:FunctionComponent<{children:any,routeInfo:RouteInfo}>;

    /**
     * Wraps the children passed into the layout and is rendered inside of page transitions
     */
    PageWrapper?:FunctionComponent<{children:any,routeInfo:RouteInfo}>;
}

export type DefaultLayoutPropsNoRouteInfo=Omit<DefaultLayoutProps,'routeInfo'>;

export function DefaultLayout({
    routeInfo,
    pageTransitions,
    unstyled,
    className,
    children,
    LayoutWrapper,
    PageWrapper
}:DefaultLayoutProps){

    if(PageWrapper){
        children=<PageWrapper routeInfo={routeInfo}>{children}</PageWrapper>
    }

    let content=(pageTransitions?
        <AnimatedPageTransition
            routeInfo={routeInfo}
            {...(typeof pageTransitions === 'object'?pageTransitions:{})}
        >
            {children}
        </AnimatedPageTransition>
    :
        children
    )

    if(LayoutWrapper){
        content=<LayoutWrapper routeInfo={routeInfo}>{content}</LayoutWrapper>
    }

    style.root();

    return (
        <div className={cn(unstyled?null:"DefaultLayout",className)}>
            {content}
        </div>
    )

}

const style=atDotCss({name:'DefaultLayout',order:'frameworkHigh',css:`
    .DefaultLayout{
        display:flex;
        flex-direction:column;
        position:relative;
        width:100%;
        height:100%;
    }
`});
