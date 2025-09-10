import { parse } from "./parse.js";
import { stringify } from "./stringify.js";

export const parseJson5=parse;
export const JSON5={
    parse,
    stringify
} as const;
Object.freeze(JSON5);
