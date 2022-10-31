import { DependencyContainer, globalDeps, TypeRef } from "@iyio/common";
import { useMemo } from "react";

export const useDep=<T>(typeRef:TypeRef<T>|symbol,deps:DependencyContainer=globalDeps):T=>
{
    return useMemo<T>(()=>deps.require<T>(typeRef),[typeRef,deps]);
}

export const useDepOrDefault=<T>(typeRef:TypeRef<T>|symbol,deps:DependencyContainer=globalDeps):T|undefined=>
{
    return useMemo<T|undefined>(()=>deps.get<T>(typeRef),[typeRef,deps]);
}

export const useDepAsFallback=<T>(typeRef:TypeRef<T>|symbol,primaryValue:T|null|undefined,deps:DependencyContainer=globalDeps):T=>
{
    return useMemo<T>(()=>primaryValue??deps.require<T>(typeRef),[typeRef,primaryValue,deps]);
}

export const useDepOrDefaultAsFallback=<T>(typeRef:TypeRef<T>|symbol,primaryValue:T|null|undefined,deps:DependencyContainer=globalDeps):T|undefined=>
{
    return useMemo<T|undefined>(()=>primaryValue??deps.get<T>(typeRef),[typeRef,primaryValue,deps]);
}
