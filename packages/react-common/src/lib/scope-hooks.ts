import { ReadonlyObservableTypeDef, rootScope, Scope } from "@iyio/common";
import { useSubject } from "./rxjs-hooks";

export const useCurrent=<T>(current:ReadonlyObservableTypeDef<T>,scope:Scope=rootScope):T=>
{
    return useSubject(scope.to(current).subject);
}
