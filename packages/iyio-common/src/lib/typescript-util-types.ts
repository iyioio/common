export type TrimLeft<Str extends string>=string extends Str?
    'Error':
    Str extends ` ${infer Str}`|`\n${infer Str}`|`\r${infer Str}`|`\t${infer Str}`?
        TrimLeft<Str>:
        Str;

export type TrimRight<Str extends string>=string extends Str ?
    'Error':
    Str extends `${infer Str} `|`${infer Str}\n`|`${infer Str}\r`|`${infer Str}\t`?
        TrimRight<Str>:
        Str;

export type Trim<Str extends string>=string extends Str?
    'Error':
    TrimRight<TrimLeft<Str>>;

export type WhiteSpace=' '|'\n'|'\r'|'\t';

export type RequiredRecursive<T>=T extends object?{
    [K in keyof Required<T>]:RequiredRecursive<Required<T>[K]>;
}:T;

export type UnionToIntersection<U>=
  (U extends any ?(x: U)=>void : never) extends ((x: infer I)=>void) ? I : never;
