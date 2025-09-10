import { Evt } from "./Evt.js";
import { ValueCondition } from "./value-condition-types.js";

/**
 * Called by firing EvtTriggers. `key` and `type` can be used by the callback to help
 * determine how to process the event or by proxy callback to select their target.
 */
export type EvtTriggerCallback=(evt:Evt,evtKey:string,trigger:EvtTriggerBase)=>void;

/**
 * Used to trigger callbacks based on events.
 */
export interface EvtTrigger extends EvtTriggerBase
{
    /**
     * The callback to be called when the trigger is fired.
     */
    callback?:EvtTriggerCallback;
}

export interface EvtTriggerBase
{
    /**
     * Used to match against event keys to fire the trigger. If `matchStart` is true the match key
     * only needs to start with an event key to be fired.
     */
    matchKey:string;

    /**
     * If true `matchKey` will match event keys that the match key starts with, otherwise the match
     * key will need to match the event key exactly.
     */
    matchStart?:boolean;

    /**
     * If defined the condition must evaluate to true in-order with the trigger to fire. The
     * condition is tested against the event object.
     *
     * @example
     * // This condition passes if the event value has a property of username that starts with "Ricky"
     * {
     *     op:"starts-with",
     *     path:"value.username",
     *     value:"Ricky"
     * }
     */
    condition?:ValueCondition;

    /**
     * Extra data passed to the callback
     */
    value?:any;

    /**
     * maps values from the context of the trigger to keys of the value of the trigger.
     */
    valueMap?:Record<string,string>;

    /**
     * An optional type string that is passed to the callback to help determine how to handle the event.
     */
    type?:string;

    /**
     * An optional key that is passed to the callback to help determine how to handle the event.
     */
    key?:string;

    /**
     * An optional target string that is passed to the callback to help determine how to handle the event.
     */
    target?:string;

    /**
     * The desired topic to publish the trigger to. It is up to trigger listeners to handle
     * publishing fired triggers and publishing is not guaranteed.
     */
    topic?:string;

}
