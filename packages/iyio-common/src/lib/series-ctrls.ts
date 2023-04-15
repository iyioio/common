import { addDays, addMonths, addWeeks, addYears, endOfDay, endOfMonth, endOfWeek, endOfYear, format, startOfDay, startOfMonth, startOfWeek, startOfYear } from 'date-fns';
import { UnsupportedError } from "./errors";
import { SeriesIntervalCtrl, SeriesRange, SeriesType } from "./series-types";

export class DaySeriesIntervalCtrl implements SeriesIntervalCtrl<Date>
{

    public format:string;

    public constructor(format:string='E')
    {
        this.format=format;
    }

    public getDefault(offset:number){
        return this.add(startOfDay(new Date()),offset);
    }
    public add(value:Date,count:number):Date{
        return addDays(value,count);
    }
    public getRange(value:Date):SeriesRange<Date>
    {
        const start=startOfDay(value)
        return {
            name:format(start,this.format),
            start,
            end:endOfDay(value)
        }
    }
}

export class WeekSeriesIntervalCtrl implements SeriesIntervalCtrl<Date>
{

    public format:string;

    public constructor(format:string='do')
    {
        this.format=format;
    }

    public getDefault(offset:number){
        return this.add(startOfWeek(new Date()),offset);
    }
    public add(value:Date,count:number):Date{
        return addWeeks(value,count);
    }
    public getRange(value:Date):SeriesRange<Date>
    {
        const start=startOfWeek(value)
        return {
            name:format(start,this.format),
            start,
            end:endOfWeek(value)
        }
    }
}

export class MonthSeriesIntervalCtrl implements SeriesIntervalCtrl<Date>
{

    public format:string;

    public constructor(format:string='MMM')
    {
        this.format=format;
    }

    public getDefault(offset:number){
        return this.add(startOfMonth(new Date()),offset);
    }
    public add(value:Date,count:number):Date{
        return addMonths(value,count);
    }
    public getRange(value:Date):SeriesRange<Date>
    {
        const start=startOfMonth(value)
        return {
            name:format(start,this.format),
            start,
            end:endOfMonth(value)
        }
    }
}

export class YearSeriesIntervalCtrl implements SeriesIntervalCtrl<Date>
{

    public format:string;

    public constructor(format:string='yyyy')
    {
        this.format=format;
    }

    public getDefault(offset:number){
        return this.add(startOfYear(new Date()),offset);
    }
    public add(value:Date,count:number):Date{
        return addYears(value,count);
    }
    public getRange(value:Date):SeriesRange<Date>
    {
        const start=startOfYear(value)
        return {
            name:format(start,this.format),
            start,
            end:endOfYear(value)
        }
    }
}

export const getSeriesIntervalCtrl=(type:SeriesType):SeriesIntervalCtrl=>{
    switch(type){

        case 'day':
            return new DaySeriesIntervalCtrl();

        case 'week':
            return new WeekSeriesIntervalCtrl();

        case 'month':
            return new MonthSeriesIntervalCtrl();

        case 'year':
            return new YearSeriesIntervalCtrl();

        default:
            throw new UnsupportedError(`Unsupported SeriesType. type = ${type}`);
    }
}
