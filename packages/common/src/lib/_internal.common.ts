import { BaseUser } from "./BaseUser";
import { createSetter } from "./Setter";

export const TypeDefStaticValue=Symbol('TypeDefStaticValue');
export const TypeDefDefaultValue=Symbol('TypeDefDefaultValue');
export const ScopeReset=Symbol('ScopeReset');

export const _setUser=createSetter<BaseUser|null>();
