import { deps, TypeRef } from "@iyio/common";
import { useMemo } from "react";

export const useDep=<T>(typeRef:TypeRef<T>|symbol):T=>
{
    return useMemo<T>(()=>deps.require<T>(typeRef),[typeRef]);
}

export const useDepOrDefault=<T>(typeRef:TypeRef<T>|symbol):T|undefined=>
{
    return useMemo<T|undefined>(()=>deps.get<T>(typeRef),[typeRef]);
}

export const useDepAsFallback=<T>(typeRef:TypeRef<T>|symbol,primaryValue:T|null|undefined):T=>
{
    return useMemo<T>(()=>primaryValue??deps.require<T>(typeRef),[typeRef,primaryValue]);
}

export const useDepOrDefaultAsFallback=<T>(typeRef:TypeRef<T>|symbol,primaryValue:T|null|undefined):T|undefined=>
{
    return useMemo<T|undefined>(()=>primaryValue??deps.get<T>(typeRef),[typeRef,primaryValue]);
}
