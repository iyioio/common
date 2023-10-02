/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseLayoutProps } from "./base-layout";
import { ClassNameValue } from "./css";
import { Trim, WhiteSpace } from "./typescript-util-types";



type DropEnd<S extends string>=string extends S?
    'Error':
    S extends `${infer Name}${'.'|'['|'>'|WhiteSpace}${infer _Rest}`?
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

type SplitDot<S extends string>=string extends S?
    'Error':
    S extends `${infer Start}.${infer End}`?
        Start|SplitDot<End>:
        S;

type GetValue<S extends string>=string extends S?
    'Error':
    S extends `${infer _Start}.${infer Classes}${','|'{'|WhiteSpace}${infer Rest}`?
        SplitDot<Classes>:
        null;

export type ParseAt<S extends string>=string extends S?
    'Error':
    S extends `${infer _Start}@.${infer ClassName}{${infer Rest}`?
        {
            [K in SplitClasses<`@.${Trim<ClassName>}`>]:GetValue<`${ClassName} `>;
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


export type AtCssCall<T>=string extends T?T extends string?
    ((selectors?:{[KT in T]:any},options?:{classNameValues?:ClassNameValue,baseLayout?:BaseLayoutProps})=>string):never:
    ((selectors?:T,options?:{classNameValues?:ClassNameValue,baseLayout?:BaseLayoutProps})=>string);

export type ParseAtSheet<
    S extends string,
    P=Omit<ParseAt<SplitSection<SplitLargeSection<S>>>,'___AT_NOT_PROP___'>>=
{
    readonly [K in AllKeys<P>]:P[K] extends null?
        AtCssCall<{[CK in K]?:true}>:
        P[K] extends string?
            AtCssCall<{[CK in P[K]]?:any}>:
            never
} & (
    P extends {['']:any}?
        AtCssCall<{[CK in P['']]?:any}>:
        AtCssCall<{['']?:true}>
) & ({
    insertStyleSheet():void;
    isStyleSheetInserted():boolean;
});

export interface AtCssOptions<S extends string>
{
    namespace?:string;
    name:string;
    disableAutoInsert?:boolean;
    css:S;
    disableParsing?:boolean;

}

export type AtCssOptionsDefaults=Partial<Omit<AtCssOptions<string>,'css'>>;
