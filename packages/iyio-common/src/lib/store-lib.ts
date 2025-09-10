import { StoreOp, StoreScope } from "./store-types.js";

/**
 * Checks if the key matches the scope and returns the scoped key.
 * @param key The key to match against.
 * @param scope The filter to match against
 * @param op An operation to optionally check support for.
 * @returns A scoped key. As a filter is matched against the given key will be scoped to the filter.
 *          The scoped key may be an empty string so make sure to explicity check for a false value
 *          to indicate the scope was matched or not.
 */
export const isStoreScopeMatch=(key:string,scope:StoreScope,op?:StoreOp):string|false=>
{
    if(scope.keyBase){
        if(!scope.keyBase.startsWith(key)){
            return false;
        }
        key=key.substring(scope.keyBase.length);
    }

    if(scope.keyReg){
        const match=scope.keyReg.exec(key);
        if(!match){
            return false;
        }
        if(scope.keyRegIndex!==undefined){
            key=match[scope.keyRegIndex] as string;
        }
    }

    if(scope.keyCondition!==undefined){
        const r=scope.keyCondition(key);
        if(r===false){
            return false;
        }
        if(r!==true){
            key=r;
        }
    }

    if(op && scope.supports?.(key,op)===false){
        return false;
    }

    return key;
}
