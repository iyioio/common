import { AnyCompBoolLabels } from "./any-comp-types";

export const acTags={
    /**
     * Groups props in the editor ui
     */
    acGroup:'acGroup',

    /**
     * Ignores props by AnyComp
     */
    acIgnore:'acIgnore',

    /**
     * Labels for boolean values separated by a slash. The true comes first.
     * @example yes / no
     * @example on / off
     */
    acBoolLabels:'acBoolLabels',

    /**
     * A display name to use for the prop
     */
    acDisplayName:'acDisplayName',

    /**
     * An input placeholder for the prop
     */
    acPlaceholder:'acPlaceholder',
} as const;

export const parseAcBoolLabel=(value:string|null|undefined):AnyCompBoolLabels=>{
    if(!value){
        return {
            trueLabel:'true',
            falseLabel:'false',
        }
    }

    const pair=value.split('/');
    return {
        trueLabel:pair[0]?.trim()||'true',
        falseLabel:pair[1]?.trim()||'false',
    }
}
