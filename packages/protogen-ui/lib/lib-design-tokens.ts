import { BehaviorSubject } from "rxjs";
import { allDesignTokenVariations, defaultDesignTokenVariation, DesignTokens, designTokenValues, DesignTokenVariation } from "./tokens.js";


export const designVariationSubject=new BehaviorSubject<DesignTokenVariation>(defaultDesignTokenVariation);

export const dt=():DesignTokens=>{
    return designTokenValues[designVariationSubject.value];
}

/**
 * Sets the next DesignTokenVariation
 * @returns The new DesignTokenVariation
 */
export const nextDesignVariation=():DesignTokenVariation=>{
    const next=allDesignTokenVariations[
        (allDesignTokenVariations.indexOf(designVariationSubject.value)+1)%allDesignTokenVariations.length
    ]
    designVariationSubject.next(next);
    return next;
}
