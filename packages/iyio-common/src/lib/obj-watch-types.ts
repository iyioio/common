// any changes to RecursiveObjWatchEvt or ObjWatchEvt should be reflected in
// packages/obj-sync/src/lib/obj-sync-types.ts


export type RecursiveObjWatchEvt<T>=ObjWatchEvt<T> & {

    /**
     * Path to the recursively access object
     */
    path?:(string|number|null)[];
}

export const objWatchEvtSourceKey=Symbol('objWatchEvtSourceKey')

export type ObjWatchEvt<T>={
    /**
     * Can be used to specify the source of the event
     */
    [objWatchEvtSourceKey]?:any;
} & (
    {
        type:'set';

        /**
         * The prop that was set
         */
        prop:keyof T;

        /**
         * The value the prop was set to
         */
        value:T[keyof T];

    }
|
    {
        type:'delete';

        /**
         * The prop that was deleted
         */
        prop:keyof T;

    }
|
    {
        type:'aryChange';

        /**
         * The index where the items were inserted
         */
        index:number;

        /**
         * The number of items delete at the index
         */
        deleteCount?:number;

        /**
         * The items inserted as the index
         */
        values?:T extends Array<any>?T[number][]:never;
    }
|
    {
        type:'aryMove';
        /**
         * The index where items were moved from
         */
        fromIndex:number;
        /**
         * The index where items were moved to
         */
        toIndex:number;

        /**
         * The number of items moved.
         */
        count:number;
    }
|
    {
        type:'event';

        eventType:string|symbol;

        eventValue?:any;
    }
|
    {
        type:'change';
    }
|
    {
        /**
         * Triggered when the watched object should load resources. This event is triggered by
         * watchers and is usually used with lazy loading resources.
         */
        type:'load';

        /**
         * The prop to load
         */
        prop?:keyof T;
    }

)

export type ObjWatchEvtType=ObjWatchEvt<any>['type'];

export type ObjWatchListener<T=any>=(obj:T,evt:ObjWatchEvt<T>)=>void;

export type Watchable=Record<string,any>|any[];

/**
 * Called when a recursive change is make to a recursively watched object.
 * The path param is mutated as the change event moves between watchers. If a reference to the
 * path is needed after the return of the callback make sure to make a copy.
 * @param reversePath the reverse path of where the change occurred.
 */
export type ObjRecursiveListener<T=any>=(obj:T,evt:ObjWatchEvt<any>,reversePath:(string|number|null)[])=>void;

/**
 * Called when a recursive change is make to a recursively watched object.
 * The path param is mutated as the change event moves between watchers. If a reference to the
 * path is needed after the return of the callback make sure to make a copy.
 * @param reversePath the reverse path of where the change occurred.
 */
export type ObjRecursiveListenerOptionalEvt<T=any>=(obj:T,evt:ObjWatchEvt<any>|null,reversePath:(string|number|null)[]|null)=>void;

export interface WatchedPath
{
    listener:ObjRecursiveListener;
    path:(string|number)[]|ObjWatchFilter<any>;
    dispose:()=>void;
}


export interface PathListenerOptions
{
    /**
     * If true descendants of the watched path will also trigger change callbacks.
     */
    deep?:boolean;

    debug?:boolean;
}
export interface PathWatchOptions extends PathListenerOptions
{
    /**
     * If true the change callback will not be called at initialization.
     */
    skipInitCall?:boolean;
}


export type ObjWatchFilterCallback<T>=(value:T,key:keyof T)=>boolean|ObjWatchFilter<T[keyof T]>|'*';
export type ObjWatchFilterValue<T>=boolean|'*'|ObjWatchFilterCallback<T>|ObjWatchFilter<T[keyof T]>;

export const anyProp:string='';
export type ObjWatchFilter<T>={
    [K in keyof T]?:ObjWatchFilterValue<T>
} & {
    /**
     * When defining filters do not use a string literal. You must use brackets and the anyProp constant.
     * filter ={
     *     [anyProp]:'*'
     * }
     */
    ''?:ObjWatchFilterValue<T>;
}
