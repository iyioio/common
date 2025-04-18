import { HashMap } from "./common-types";
import { Query } from "./query-types";

export interface SeriesData
{
    labels:string[];
    series:number[][];
    timestamps:number[][];
}

export interface SeriesDataQuery
{
    query:Query;
    getSeriesData(rows:HashMap[]):SeriesData;
}

export interface SeriesRange<T=any>
{
    name?:string;
    start:T;
    end:T;
}

export type SeriesType='day'|'week'|'month'|'year';

export type SeriesOffset=boolean|SeriesType;

export type SeriesRangeType='<=>'|'<>'|'>'|'<'|'>='|'<=';

export interface AutoSeries
{
    type:SeriesType;
    start?:any;
    count:number;
    format?:string;
    useNumbers?:boolean;
    labelInterval?: number;
}

export interface Series<T=any>
{
    auto?:AutoSeries;
    ranges?:SeriesRange<T>[];
    /**
     * Controls how range values are applied to queries
     * @default '<=>'
     */
    rangeType?:SeriesRangeType;
    repeat?:number|T[];
    offset?:SeriesOffset;
    offsetMultiplier?:number;
    debug?:boolean;
}

export interface SeriesIntervalCtrl<T=any>
{
    getDefault(offset:number):T;
    add(value:T,count:number):T;
    getRange(value:T):SeriesRange<T>;
}
