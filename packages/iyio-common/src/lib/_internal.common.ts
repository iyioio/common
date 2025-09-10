import type { BaseUser } from "./BaseUser.js";
import { createSetter } from "./Setter.js";

export const TypeDefStaticValue=Symbol('TypeDefStaticValue');
export const TypeDefDefaultValue=Symbol('TypeDefDefaultValue');
export const ScopeReset=Symbol('ScopeReset');

export const _setUser=createSetter<BaseUser|null>();
