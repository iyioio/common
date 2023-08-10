export type RecursiveObjWatchEvt<T>=ObjWatchEvt<T> & {

    /**
     * Path to the recursively access object
     */
    path?:(string|number|null)[];
}

export type ObjWatchEvt<T>=(
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

/**
 * Called when a recursive change is make to a recursively watched object.
 * The path param is mutated as the change event moves between watchers. If a reference to the
 * path is needed after the return of the callback make sure to make a copy.
 */
export type ObjRecursiveListener=(obj:any,evt:ObjWatchEvt<any>,path:(string|number|null)[])=>void;
