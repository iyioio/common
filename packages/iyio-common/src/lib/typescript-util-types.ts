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
