import { ValueBag } from "./ValueBag.js";
import { defineService } from "./scope-lib.js";

export const valueBag=defineService('valueBag',()=>new ValueBag());
