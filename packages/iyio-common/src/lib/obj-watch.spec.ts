import { wAryMove, wAryPush, wAryRemove, wAryRemoveAt, wArySplice, watchObj, watchObjDeep, watchObjWithFilter, wDeleteProp, wSetProp, wTriggerChange, wTriggerEvent, wTriggerLoad } from "./obj-watch-lib.js";
import { anyProp, ObjWatchEvt, ObjWatchEvtType } from "./obj-watch-types.js";
import { deepCompare } from "./object.js";
import { ObjMirror } from './ObjMirror.js';

describe('obj-watch',()=>{

    it('should mirror object',()=>{

        const src:any={};
        const target:any={};

        expect(target).not.toBe(src);
        const _log=()=>{
            console.info(JSON.stringify({src,target},null,4))
        }
        const check=(name:string)=>{
            const same=deepCompare(src,target);

            if(!same){
                _log();
                throw new Error('objs not the same - '+name);
            }
        }

        check('init');

        const watcher=watchObj(src);
        const mirror=new ObjMirror(target);

        const evtCounts:any={};
        const expectEventCount=(type:ObjWatchEvtType,count:number)=>{
            expect(evtCounts[type]??0).toBe(count);
        }

        let skateboardLoaded=false;
        let testEvtTriggered=false;

        watcher?.addRecursiveListener(mirror.recursiveCallback);
        watchObj(target)?.addRecursiveListener((obj:any,evt:ObjWatchEvt<any>)=>{
            if(!evtCounts[evt.type]){
                evtCounts[evt.type]=1;
            }else{
                evtCounts[evt.type]++;
            }
            if(evt.type==='load' && evt.prop==='skateboard'){
                skateboardLoaded=true;
            }else if(evt.type==='event' && evt.eventType==='tester-evt' && evt.eventValue==='omg'){
                testEvtTriggered=true;
            }
        });

        wSetProp(src,'num',123);
        check('num');

        const srcAry=[1,2,3,4];
        wSetProp(src,'ary',srcAry);
        const ary=target.ary;
        expect(src.ary).not.toBe(ary);
        expect(deepCompare(srcAry,ary)).toBe(true);
        expect(deepCompare(ary,[1,2,3,4])).toBe(true);
        check('ary');


        wAryPush(srcAry,5);
        expect(deepCompare(ary,[1,2,3,4,5])).toBe(true);
        check('ary push');

        wAryMove(srcAry,0,3);
        expect(deepCompare(ary,[2,3,4,1,5])).toBe(true);
        check('ary move');

        wArySplice(srcAry,1,1,77,88);
        expect(deepCompare(ary,[2,77,88,4,1,5])).toBe(true);
        check('ary splice');

        wAryRemove(srcAry,88);
        expect(deepCompare(ary,[2,77,4,1,5])).toBe(true);
        check('ary remove');

        wAryRemoveAt(srcAry,2);
        expect(deepCompare(ary,[2,77,1,5])).toBe(true);
        check('ary remove');


        const newObj={
            a:9,
            b:'asdf',
            c:false,
            d:{
                cat:"bad",
                dog:'Good'
            },
            oAry:[9,8,7,{
                name:'bart',
                age:11,
            }]
        }
        wSetProp(src,'newObj',newObj);
        expect(src.newObj).not.toBe(target.newObj);
        const srcBart=src.newObj.oAry[3];
        const bart=target.newObj.oAry[3];
        expect(bart?.name).toBe('bart');
        check('newObj');

        wSetProp(srcBart,'city','Springfield');
        expect(bart.city).toBe('Springfield');
        check('bart city');



        wSetProp(src,'del','delete me');
        expect(src.del).toBe('delete me');
        check('delete set');
        wDeleteProp(src,'del');
        expect(src.del).toBeUndefined();
        check('delete');


        expectEventCount('event',0);
        expectEventCount('change',0);
        expectEventCount('load',0);

        wTriggerLoad(srcBart,'skateboard');
        expectEventCount('event',0);
        expectEventCount('change',0);
        expectEventCount('load',1);
        expect(skateboardLoaded).toBe(true);

        wTriggerChange(srcBart);
        expectEventCount('event',0);
        expectEventCount('change',1);
        expectEventCount('load',1);

        wTriggerEvent(srcBart,'tester-evt','omg');
        expectEventCount('event',1);
        expectEventCount('change',1);
        expectEventCount('load',1);
        expect(testEvtTriggered).toBe(true);



        check('end');

    })

    it('should filter path',()=>{

        const dude:Dude={
            name:'Bob',
            car:{
                color:'red',
                name:'Jac',
                engine:{
                    type:'gas',
                    hp:550,
                    torque:550
                }
            }
        };


        let nameCallAll=0;
        watchObjWithFilter(dude,{
            name:true,
            car:'*'
        },()=>{
            nameCallAll++;
        })


        let jobs=0;
        watchObjWithFilter(dude,{
            jobs:'*'
        },()=>{
            jobs++;
        })


        let notAgeAll=0;
        watchObjWithFilter(dude,{
            age:false,
            [anyProp]:'*',
        },()=>{
            notAgeAll++;
        })


        let notAge=0;
        watchObjWithFilter(dude,{
            age:false,
            [anyProp]:true,
        },()=>{
            notAge++;
        })


        let jobMap=0;
        watchObjWithFilter(dude,{
            jobMap:{
                [anyProp]:{
                    pay:'*',
                    startTime:true,
                },
            }
        },()=>{
            jobMap++;
        })


        let deepSet=0;
        watchObjWithFilter(dude,{
            mainJob:{
                subJob:{
                    subJob:{
                        pay:true,

                    }
                }
            }
        },()=>{
            deepSet++;
        })


        let jobsStartTime=0;
        watchObjWithFilter(dude,{
            jobs:{
                [anyProp]:{
                    startTime:true
                }
            },
        },()=>{
            jobsStartTime++;
        })


        let count=0;
        let countValue=0;
        watchObjDeep(dude,()=>{
            count++;
        })


        let notAgeAllValue=0;
        let notAgeValue=0;

        //evtPath: [ 'age' ]
        wSetProp(dude,'age',33);
        expect(count).toBe(++countValue);
        expect(nameCallAll).toBe(0);
        expect(jobs).toBe(0);
        expect(notAgeAll).toBe(0);
        expect(notAge).toBe(0);
        expect(jobMap).toBe(0);
        expect(deepSet).toBe(0);
        expect(jobsStartTime).toBe(0);

        //evtPath: [ 'name', 'car' ]
        wSetProp(dude.car,'name','Jeff');
        expect(count).toBe(++countValue);
        expect(nameCallAll).toBe(1);
        expect(jobs).toBe(0);
        expect(notAgeAll).toBe(++notAgeAllValue);
        expect(notAge).toBe(0);
        expect(jobMap).toBe(0);
        expect(deepSet).toBe(0);
        expect(jobsStartTime).toBe(0);

        //evtPath: [ 'name' ]
        wSetProp(dude,'name','tom');
        expect(count).toBe(++countValue);
        expect(nameCallAll).toBe(2);
        expect(jobs).toBe(0);
        expect(notAgeAll).toBe(++notAgeAllValue);
        expect(notAge).toBe(++notAgeValue);
        expect(jobMap).toBe(0);
        expect(deepSet).toBe(0);
        expect(jobsStartTime).toBe(0);

        //evtPath: [ 'jobMap' ]
        const job1:Job={
            pay:1,
            startTime:'too early'
        }
        wSetProp(dude,'jobMap',{job1});
        expect(count).toBe(++countValue);
        expect(nameCallAll).toBe(2);
        expect(jobs).toBe(0);
        expect(notAgeAll).toBe(++notAgeAllValue);
        expect(notAge).toBe(++notAgeValue);
        expect(jobMap).toBe(1);
        expect(deepSet).toBe(0);
        expect(jobsStartTime).toBe(0);

        //evtPath: [ 'mainJob' ]
        const mainJob:Job={
            pay:100,
            startTime:'morning, not too early',
            subJob:{
                pay:10
            }
        }
        wSetProp(dude,'mainJob',mainJob);
        expect(count).toBe(++countValue);
        expect(nameCallAll).toBe(2);
        expect(jobs).toBe(0);
        expect(notAgeAll).toBe(++notAgeAllValue);
        expect(notAge).toBe(++notAgeValue);
        expect(jobMap).toBe(1);
        expect(deepSet).toBe(0);
        expect(jobsStartTime).toBe(0);

        //evtPath: [ 'subJob', 'subJob', 'mainJob' ]
        const mainJobSubSub:Job={
            pay:44,
        }
        wSetProp(dude.mainJob?.subJob,'subJob',mainJobSubSub);
        expect(count).toBe(++countValue);
        expect(nameCallAll).toBe(2);
        expect(jobs).toBe(0);
        expect(notAgeAll).toBe(++notAgeAllValue);
        expect(notAge).toBe(notAgeValue);
        expect(jobMap).toBe(1);
        expect(deepSet).toBe(1);
        expect(jobsStartTime).toBe(0);

        //evtPath: [ 'jobs' ]
        const aryJob1:Job={
            pay:222,
            startTime:'mid day'
        }
        wSetProp(dude,'jobs',[aryJob1]);
        expect(count).toBe(++countValue);
        expect(nameCallAll).toBe(2);
        expect(jobs).toBe(1);
        expect(notAgeAll).toBe(++notAgeAllValue);
        expect(notAge).toBe(++notAgeValue);
        expect(jobMap).toBe(1);
        expect(deepSet).toBe(1);
        expect(jobsStartTime).toBe(1);

        //evtPath: [ 'startTime', '0', 'jobs' ]
        wSetProp(dude.jobs?.[0],'startTime','later in the day');
        expect(count).toBe(++countValue);
        expect(nameCallAll).toBe(2);
        expect(jobs).toBe(2);
        expect(notAgeAll).toBe(++notAgeAllValue);
        expect(notAge).toBe(notAgeValue);
        expect(jobMap).toBe(1);
        expect(deepSet).toBe(1);
        expect(jobsStartTime).toBe(2);

    });

})


interface Dude
{
    name:string;
    age?:number;
    car?:Car;
    jobs?:Job[];
    jobMap?:Record<string,Job>;
    mainJob?:Job;
}

interface Job
{
    pay?:number;
    startTime?:string;
    subJob?:Job;
}

interface Car
{
    name:string;
    color:string;
    engine?:Engine;
}

interface Engine{
    type:string;
    hp:number;
    torque:number;
}

