import { wAryMove, wAryPush, wAryRemove, wAryRemoveAt, wArySplice, watchObj, wDeleteProp, wSetProp, wTriggerChange, wTriggerEvent, wTriggerLoad } from "./obj-watch-lib";
import { ObjWatchEvt, ObjWatchEvtType } from "./obj-watch-types";
import { deepCompare } from "./object";
import { ObjMirror } from './ObjMirror';

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

})
