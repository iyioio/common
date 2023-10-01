/* eslint-disable @typescript-eslint/no-unused-vars */

import { Trim } from "./typescript-util-types";

type DropEnd<S extends string>=string extends S?
    'Error':
    S extends `${infer Name}${'.'|' '|'['|'>'|'\n'|'\t'}${infer _Rest}`?
        DropEnd<Trim<Name>>:
        S;

type FilterAt<S extends string>=string extends S?
    'Error':
    S extends `@.${infer Name}`?
        DropEnd<Trim<Name>>:
        never;

type SplitClasses<S extends string>=string extends S?
    'Error':
    S extends `${infer Name},${infer Rest}`?
        FilterAt<Trim<Name>>|SplitClasses<Trim<Rest>>:
        FilterAt<Trim<S>>;

type ParseAt<S extends string>=string extends S?
    'Error':
    S extends `${infer _Start}@.${infer ClassName}{${infer Rest}`?
        {
            [k in SplitClasses<`@.${Trim<ClassName>}`>]:string;
        } & Exclude<ParseAt<Rest>,S>
    :
        {___AT_NOT_PROP___:true}
    ;

type SplitSection<S extends string>=string extends S?
    'Error':
    S extends `${infer Before}/*-${infer _Comment}-*/${infer After}`?
        Before|SplitSection<After>:
        S;

type SplitLargeSection<S extends string>=string extends S?
    'Error':
    S extends `${infer Before}/***-${infer _Comment}-***/${infer After}`?
        Before|SplitLargeSection<After>:
        S;

type AllKeys<T>=T extends any?keyof T:never;

export type ParseAtSheet<S extends string>=Omit<
    {
        [k in AllKeys<ParseAt<SplitSection<SplitLargeSection<S>>>>]: string;
    },
    '___AT_NOT_PROP___'
>;
