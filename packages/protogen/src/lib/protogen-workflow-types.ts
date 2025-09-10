import { ProtoExpression } from "./protogen-expression-types.js";
import { ProtoTypeInfo } from "./protogen-types.js";

export interface ProtoAction
{
    name:string;

    /**
     * Determines the workers the action is executed against. When actions are stored using
     * ActionRecords one ActionRecord is created for every nodeAddress.
     */
    workerAddresses:Record<string,string>;

    /**
     * The order in-which actions are executed. By default actions will use the current date's
     * timestamp as their order so that newer actions will be executed after older ones. If you
     * want an action to be executed before default order actions use a negative number and if
     * you want an action to be executed after default order actions use a number that is more than
     * endDateSort. endDateSort is a constant with a value of 1,000,000,000,000,000
     * which when converted to a date equals 1000000000000000
     */
    order:number;

    /**
     * The max number of times the trigger can be executed for a single worker. If undefined
     * no limit is set.
     */
    maxWorkerExeCount?:number;

    /**
     * The max number of times the trigger can be executed for a worker group. If undefined
     * no limit is set.
     */
    maxGroupExeCount?:number;

    /**
     * Triggers that cause the action to be executed
     */
    triggers?:ProtoTrigger[];

    /**
     * Time windows when the trigger can be executed
     */
    windows?:ProtoTimeWindow[];

    /**
     * A condition that must be met.
     */
    condition?:ProtoExpression;

    /**
     * The expression that is executed with the action is triggered.
     */
    exe?:ProtoExpression;

}

export interface ProtoTrigger
{

    /**
     * @default 'trigger'
     */
    name:string;

    /**
     * Name or address of the event node that triggers the trigger;
     */
    address:string;
}


export interface ProtoTimeWindow
{
    start?:number;
    end?:number;
}


/**
 * A worker moves between nodes and executes actions
 */
export interface ProtoWorker
{
    /**
     * The current location of the worker
     */
    address:string;

    /**
     * Id of an object that the worker is attached to.
     */
    attachId?:string;

    /**
     * Data associated with the worker
     */
    data:Record<string,any>;
}

/**
 * Represents and a node dedicated to hosting workers. Any node can be a worker group since
 * workers are grouped by nodeAddress and nodeAddresses can point to any node. When parsed a
 * worker group uses the workers property to store workers buts nodes can use any property name.
 */
export interface ProtoWorkerGroup
{
    name:string;
    address:string;
    type?:ProtoTypeInfo;
    workers?:ProtoWorker[];
}

export interface ProtoWorkflow
{
    actions:ProtoAction[];
    /**
     * Additional expressions that actions can call
     */
    expressions:ProtoExpression[];

    workerGroups:Record<string,ProtoWorkerGroup>;
}
