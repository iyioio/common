import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import { Construct } from "constructs";
import { ManagedProps } from "./ManagedProps.js";
import { IEventTarget } from "./cdk-types.js";

export interface BridgeEventProps
{
    disabled?:boolean;
    cron?:events.CronOptions;
    managed?:ManagedProps;
    targets?:IEventTarget[];
    eventName?:string;
}

export class BridgeEvent extends Construct
{
    public readonly rule:events.Rule;

    public readonly eventName:string;

    public constructor(scope:Construct,name:string,{
        disabled,
        cron,
        managed,
        targets,
        eventName=name,
    }:BridgeEventProps){

        super(scope,name);

        this.eventName=eventName;
        this.rule=new events.Rule(this,`Rule`,{
            enabled:!disabled,
            schedule:cron?events.Schedule.cron(cron):undefined
        });

        if(targets){
            for(const t of targets){
                this.addTarget(t);
            }
        }

        if(managed){
            managed.events.push(this);
            managed.resources.push({name,event:this});
        }
    }

    public addTarget(target:IEventTarget){

        if(target.managedName!==undefined && target.managedName!==this.eventName){
            return;
        }

        if(target.fn){
            this.rule.addTarget(new targets.LambdaFunction(target.fn));
            targets.addLambdaPermission(this.rule,target.fn);
        }

        if(target.getEventTarget){
            this.rule.addTarget(target.getEventTarget(this.eventName,this));
        }
    }


}
