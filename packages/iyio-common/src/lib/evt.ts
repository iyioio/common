export interface Evt<TType extends string=string,TValue=any>
{
    type:TType;

    /**
     * If undefined the event's type will be used as its key
     */
    key?:string;
    target?:string;
    source?:string;
    metadata?:Record<string,any>;
    value?:TValue;
}
