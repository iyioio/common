import { parse } from "./parse";
import { stringify } from "./stringify";

export const parseJson5=parse;
export const JSON5={
    parse,
    stringify
} as const;
Object.freeze(JSON5);
