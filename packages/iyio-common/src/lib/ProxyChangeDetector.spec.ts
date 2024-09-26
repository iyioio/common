import { ProxyChangeDetector, ProxyObjectChangeEvt } from './ProxyChangeDetector';
import { asType } from './common-lib';

describe('ProxyChangeDetector',()=>{

    it('should detect changes with depth of 1',()=>{

        const obj:any={
            a:'1',
            l2:{
                p1:'1'
            }
        };

        let lastEvt:ProxyObjectChangeEvt|undefined;

        const cd=new ProxyChangeDetector({
            target:obj,
            maxDepth:1,
            listener:(evt)=>{
                lastEvt=evt;
            }
        });
        const proxy=cd.proxy;

        expect(lastEvt).toBeUndefined();

        proxy.b='2';

        expect(lastEvt).toEqual(asType<ProxyObjectChangeEvt>({
            type:'set',
            target:obj,
            prop:'b',
            rootTarget:obj,
            newValue:'2',
            receiver:obj
        }));

        lastEvt=undefined;
        proxy.l2.p2='2';
        expect(lastEvt).toBeUndefined();


        lastEvt=undefined;
        cd.dispose();
        expect(lastEvt).toBeUndefined();

        let setProp=false;
        try{
            proxy.c='3';
            setProp=true;
        }catch{
            //
        }
        expect(setProp).toBe(false);
    })

    it('should detect changes with depth of 2',()=>{

        const obj:any={
            a:'1',
            l2:{
                p1:'1',
                l3:{
                    lp1:'1'
                }
            }
        };

        let lastEvt:ProxyObjectChangeEvt|undefined;

        const cd=new ProxyChangeDetector({
            target:obj,
            maxDepth:2,
            listener:(evt)=>{
                lastEvt=evt;
            }
        });
        const proxy=cd.proxy;

        expect(lastEvt).toBeUndefined();

        proxy.b='2';
        expect(lastEvt).toEqual(asType<ProxyObjectChangeEvt>({
            type:'set',
            target:obj,
            prop:'b',
            rootTarget:obj,
            newValue:'2',
            receiver:obj
        }));

        lastEvt=undefined;
        proxy.l2.p2='_2';
        expect(lastEvt).toEqual(asType<ProxyObjectChangeEvt>({
            type:'set',
            target:obj.l2,
            prop:'p2',
            rootTarget:obj,
            newValue:'_2',
            receiver:obj.l2
        }));

        lastEvt=undefined;
        proxy.l2.l3.p3='_3';
        expect(lastEvt).toBeUndefined()


        lastEvt=undefined;
        cd.dispose();
        expect(lastEvt).toBeUndefined();

        let setProp=false;
        try{
            proxy.c='3';
            setProp=true;
        }catch{
            //
        }
        expect(setProp).toBe(false);
    })

})
