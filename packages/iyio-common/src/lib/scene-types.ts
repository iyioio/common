import { ZodSchema } from "zod";
import { OptionalId } from "./common-types.js";

export interface ScenePartial
{
    id?:string;
    name?:string;
    type?:string;
    description?:string;
    objects?:(SceneObjPartial|null|undefined)[];
    props?:(SceneProperty|null|undefined)[];
    actions?:(OptionalId<SceneAction>|null|undefined)[];
    children?:(ScenePartial|null|undefined)[];
}

export interface Scene extends Omit<ScenePartial,'id'|'object'|'children'|'props'|'actions'>
{
    id:string;
    objects?:SceneObj[];
    children?:Scene[];
    props?:SceneProperty[];
    actions?:SceneAction[];
}

export interface SceneObjPartial
{
    id?:string;
    name?:string;
    type?:string;
    description?:string;
    props?:(SceneProperty|null|undefined)[]
    actions?:(OptionalId<SceneAction>|null|undefined)[]
    children?:(SceneObjPartial|null|undefined)[];
}
export interface SceneObj extends Omit<SceneObjPartial,'id'|'children'|'props'|'actions'>
{
    id:string;
    children?:SceneObj[];
    props?:SceneProperty[];
    actions?:SceneAction[];
}

export interface SceneProperty<T=any>
{
    name:string;
    type?:string;
    description?:string;
    valueScheme?:ZodSchema<T>;
    value?:T;
}

export interface SceneAction<T=any>
{
    id:string;
    name:string;
    type?:string;
    description?:string;
    dataScheme?:ZodSchema<T>;
    callback?:(data:T)=>void;
}

export interface SceneDescriptor
{
    scene?:ScenePartial|null|undefined;
    obj?:SceneObjPartial|null|undefined;
    scenes?:(ScenePartial|null|undefined)[];
    objs?:(SceneObjPartial|null|undefined)[];
    props?:(SceneProperty|null|undefined)[];
    actions?:(OptionalId<SceneAction>|null|undefined)[];
}

export type SceneDescriptorProvider=()=>SceneDescriptor|SceneDescriptor[]|null|undefined;
