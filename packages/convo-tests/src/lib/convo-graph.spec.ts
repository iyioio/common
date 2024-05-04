import { initRootScope, minuteMs } from "@iyio/common";
import { ConvoGraphCtrl, ConvoMemoryGraphStore, convoScript } from "@iyio/convo-lang";
import { testModule } from './test-module';

initRootScope(testModule);

const timeout=minuteMs*10;

describe('convo-graph',()=>{

    if(process.env['NX_ENABLE_LLM_TESTING']!=='true'){
        it('should disable llm testing',()=>{
            console.info('LLM testing is disable. set env var NX_ENABLE_LLM_TESTING to true to enabled.')
        })
        return;
    }

    it('should traverse graph',async ()=>{

        const store=new ConvoMemoryGraphStore({graphId:'test',db:{
            traversers:[],
            inputs:[],
            nodes:[
                {
                    id:'a',
                    sharedConvo:convoScript`
                        > define
                        Input = struct(
                            name: string
                            age: number
                        )
                    `, /*`>`*/ // this is a tmp comment to fix syntax highlighting
                    steps:[
                        {
                            convo:convoScript`
                                @output
                                > setHobby(
                                    # name of hobby
                                    name:string
                                ) -> (
                                    return({name:name,success:true})
                                )

                                > user
                                Set a the most likely hobby for the user described below.

                                user:
                                {{input}}
                            `, /*`>`*/ // this is a tmp comment to fix syntax highlighting
                        }
                    ]
                },
                {
                    id:'b',
                    sharedConvo:convoScript`
                        > define
                        Input = struct(
                            hobbyName:string
                        )
                    `,
                    steps:[
                        {
                            convo:convoScript`
                                @output
                                # Sets the estimated yearly price of the hobby
                                > setEstimatedPrice(
                                    # The year price of the hobby. Should not be 0
                                    priceUSD: number
                                ) -> (
                                    return({
                                        priceUSD:priceUSD
                                        success: true
                                    })
                                )

                                > user
                                Estimate the yearly price of the following hobby by calling setEstimatedPrice.
                                Use you best estimate, it is ok to guess.

                                Hobby
                                {{input.hobbyName}}
                            `
                        }
                    ]
                },
            ],
            edges:[
                {
                    id:'e_0',
                    from:'a',
                    to:'b'
                },
            ]
        }});
        const ctrl=new ConvoGraphCtrl({store});
        ctrl.onMonitorEvent.subscribe(e=>console.log(`${e.type} / ${e.traverser?.exeState} - ${e.text} - `,'payload:',e.traverser?.payload));

        const group=await ctrl.startTraversalAsync({
            payload:{fistName:'Bob',lastName:'Maxx',bio:'I lived in the forest for 40 years and I just turned 60 years old'},
            edge:'a',
        });


        await ctrl.runGroupAsync(group);

        expect(group.traversers.value[0]?.payload?.success).toBe(true);


    },timeout)

});




