import { initRootScope, minuteMs } from "@iyio/common";
import { ConvoGraphCtrl, ConvoMemoryGraphStore, convoScript } from "@iyio/convo-lang";
import { testModule } from './test-module';

initRootScope(testModule);

const timeout=minuteMs;

describe('convo-graph',()=>{

    it('should traverse graph',async ()=>{

        const store=new ConvoMemoryGraphStore({db:{
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
                                    return({name:name,input:input,success:true})
                                )

                                > user
                                Set a the most likely hobby for the user described below.

                                user:
                                {{input}}
                            `, /*`>`*/ // this is a tmp comment to fix syntax highlighting
                        }
                    ]
                }
            ]
        }});
        const ctrl=new ConvoGraphCtrl({store});
        ctrl.onMonitorEvent.subscribe(e=>console.log(`${e.type} / ${e.traverser?.exeState} - ${e.text}`,e.traverser?.payload));

        const tv=await ctrl.startTraversalAsync({
            input:{fistName:'Bob',lastName:'Maxx',bio:'I lived in the forest for 40 years and I just turned 60 years old'},
            edge:'a',
        });

        while(await ctrl.nextAsync(tv)==='ready'){
            console.log('next')
        }

        expect(tv.payload?.success).toBe(true);


    },timeout)

});




