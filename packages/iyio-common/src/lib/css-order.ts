// This file contains constants use to give standard order for css related values should as z-index

/**
 * Defines the order that should be used by different types of style sheets should use
 */
export const styleSheetOrder={

    baseLow:0,
    base:1000,
    baseHigh:2000,

    frameworkLow:3000,
    framework:4000,
    frameworkHigh:5000,

    default:6000,
    componentLow:6000,
    component:7000,
    componentHigh:8000,

    viewLow:9000,
    view:10000,
    viewHigh:11000,

} as const;


Object.freeze(styleSheetOrder);

export type StyleSheetOrder=keyof typeof styleSheetOrder;

export const getStyleSheetOrder=(order:number|StyleSheetOrder|null|undefined):number=>{

    switch(typeof order){

        case 'number':
            return order;

        case 'string':
            return styleSheetOrder[order]??styleSheetOrder.default;

        default:
            return styleSheetOrder.default;

    }
}
