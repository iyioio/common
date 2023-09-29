import { ValueBag } from "./ValueBag";
import { defineService } from "./scope-lib";

export const valueBag=defineService('valueBag',()=>new ValueBag());
