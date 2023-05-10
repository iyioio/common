import { addTimeIntervals, parseTimeInterval, TimeInterval } from "@iyio/common";
import { ProtoPipelineConfigurablePlugin } from "@iyio/protogen";
import { z } from "zod";

const AssignPluginConfig=z.object(
{
    /**
     * @default "_assign.md"
     */
    assignMarkdown:z.string().optional(),

    /**
     * @default "_assign.csv"
     */
    assignCsv:z.string().optional(),
})

export const assignPlugin:ProtoPipelineConfigurablePlugin<typeof AssignPluginConfig>=
{
    configScheme:AssignPluginConfig,
    generate:async ({
        outputs,
        nodes,
    },{
        assignMarkdown='_assign.md',
        assignCsv='_assign.csv',
    })=>{

        const users:Assignee[]=[];

        for(const node of nodes){

            const an=node.children?.['$assign'];
            if(!an){
                continue;
            }

            const name=an.children?.['user']?.value;
            const time=an.children?.['time']?.value??'0';

            if(!name){
                continue;
            }


            let user=users.find(u=>u.name===name);
            if(!user){
                user={
                    name,
                    time:{}
                }
                users.push(user);
            }

            const iv=parseTimeInterval(time);
            addTimeIntervals(user.time,iv);

        }

        console.log(users)

        if(!users.length){
            return;
        }



        outputs.push({
            path:assignCsv,
            content:'user,hours,days,weeks,months,years\n'+
            users.map(u=>`${u.name},${u.time.hours??0},${u.time.days??0},${u.time.weeks??0},${u.time.months??0},${u.time.years??0}`).join('\n')
        })


    }
}

interface Assignee{
    name:string;
    time:TimeInterval;
}
