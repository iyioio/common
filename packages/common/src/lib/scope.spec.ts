import { BehaviorSubject } from 'rxjs';
import { CancelToken } from './CancelToken';
import { delayAsync } from './common-lib';
import { EnvParams } from './EnvParams';
import { createScope, defineBoolParam, defineCallableType, defineNumberParam, defineObservable, defineParam, defineReadonlyObservable, defineService, defineStringParam, defineType, initRootScope, rootScope } from './scope-lib';
import { Scope, ScopeRegistration } from './scope-types';
import { createScopedSetter } from './Setter';
import { ScopeReset } from './_internal.common';


type Speed='fast'|'slow';
type Direction='left'|'right';

interface ICar
{
    name:string;
    speed?:Speed;
    direction?:Direction;

    go(speed:Speed):void;

    turn(direction:Direction):void;
}

interface IStatusChecker
{
    status(your:string):string;
}

class Car implements ICar, IStatusChecker
{
    name:string;
    speed?: Speed | undefined;
    direction?: Direction | undefined;

    public constructor(name:string='No. 26')
    {
        this.name=name;
    }

    go(speed: Speed): void {
        this.speed=speed;
    }
    turn(direction: Direction): void {
        this.direction=direction;
    }
    status(your:string):string{
        if(your!=='first'){
            return 'last';
        }else{
            return 'first';
        }
    }

}

const ICarType=defineCallableType<ICar>("ICarType");
const ICarType1=defineCallableType<ICar>("ICarType1");
const ICarType2=defineCallableType<ICar>("ICarType2");
const ICarType3=defineCallableType<ICar>("ICarType3");
const ICarTypeWithDefault=defineCallableType<ICar>("ICarType3",()=>new Car());

const IStatusCheckerType=defineCallableType<IStatusChecker>("IStatusCheckerType");


const ICarTypeRoot1=defineCallableType<ICar>("ICarTypeRoot1");
const ICarTypeRoot2=defineCallableType<ICar>("ICarTypeRoot1");
const ICarTypeRootWidthDefault=defineCallableType<ICar>("ICarTypeRoot1",()=>new Car());

const resetScope=(scope:Scope)=>{
    (scope as any)[ScopeReset]();
}

interface JsonData
{
    name:string;
    value:any;
}

describe('Scope',()=>{

    it('should define type',()=>{

        const scope=createScope(reg=>{
            reg.implement(ICarType,()=>new Car())
        });

        const car=scope.to(ICarType);



        expect(car()).toBeInstanceOf(Car);

        expect(car().speed).toBeUndefined();
        car().go('fast');
        expect(car().speed).toBe<Speed>('fast');

        expect(car().direction).toBeUndefined();
        car().turn('left');
        expect(car().direction).toBe<Direction>('left');

    })

    it('should define type with default provider',()=>{

        const scope=createScope();

        const car=scope.to(defineService<ICar>("car",()=>new Car()));

        expect(car()).toBeInstanceOf(Car);

    })

    it('should define type with default provider and re-scope',()=>{

        const scopeA=createScope();
        const scopeB=createScope();

        const carA=scopeA.to(defineService<ICar>("car",()=>new Car()));
        const carB=scopeB.to(carA);

        expect(carB()).toBeInstanceOf(Car);
        expect(carA()).toBeInstanceOf(Car);
        expect(carB()).not.toBe(carA());

    })

    it('should get re-scoped value',()=>{

        const scopeA=createScope();
        const scopeB=createScope();

        const carA=scopeA.to(defineService<ICar>("car",()=>new Car()));

        expect(carA(scopeB)).toBeInstanceOf(Car);
        expect(carA()).toBeInstanceOf(Car);
        expect(carA(scopeB)).not.toBe(carA());

    })

    it('should init without module',async ()=>{

        const scope=createScope();

        expect(scope.isInited()).toBe(true);

    })

    it('should re-scope with default provider',()=>{

        const scope=createScope();

        const car=ICarTypeWithDefault(scope);

        expect(car).toBeInstanceOf(Car);

    })

    it('should create singleton',()=>{

        const scope=createScope(reg=>{
            reg.implement(ICarType,()=>new Car())
        });

        const car=scope.to(ICarType);

        expect(car()).toBeInstanceOf(Car);

        const a=car();
        const b=car();
        const c=car();

        expect(a).toBe(b);
        expect(a).toBe(c);

    })

    it('should create using fluent',()=>{

        const scope=createScope(reg=>{
            reg.implement(ICarType,()=>new Car())
                .and(IStatusCheckerType);
        });

        const car=scope.to(ICarType);
        const statusChecker=scope.to(IStatusCheckerType);


        expect(car()).toBeInstanceOf(Car);
        expect(statusChecker()).toBeInstanceOf(Car);

        expect(car()).toBe(statusChecker());

    })

    it('should create factory',()=>{

        const scope=createScope(reg=>{
            reg.implement(ICarType,{
                provider:()=>new Car(),
                isFactory:true
            });
        });

        const car=scope.to(ICarType);

        expect(car()).toBeInstanceOf(Car);

        const a=car();
        const b=car();
        const c=car();

        expect(a).not.toBe(b);
        expect(a).not.toBe(c);

    })

    it('should get all',()=>{

        const scope=createScope(reg=>{
            reg.implement(ICarType,()=>new Car('a'));
            reg.implement(ICarType,()=>new Car('b'));
            reg.implement(ICarType,()=>new Car('c'));
        });

        const car=scope.to(ICarType);

        expect(car()).toBeInstanceOf(Car);

        expect(car.all().length).toBe(3);
        expect(car.all().find(c=>c.name==='a')).toBeTruthy();
        expect(car.all().find(c=>c.name==='b')).toBeTruthy();
        expect(car.all().find(c=>c.name==='c')).toBeTruthy();

    })

    it('should get tagged',()=>{

        const scope=createScope(reg=>{
            reg.implement(ICarType,()=>new Car('a'),'fast');
            reg.implement(ICarType,()=>new Car('b'));
            reg.implement(ICarType,()=>new Car('c'),['fast','first']);
        });

        const car=scope.to(ICarType);


        expect(car()).toBeInstanceOf(Car);

        expect(car.all().length).toBe(3);
        expect(car.all('fast').length).toBe(2);
        expect(car.all('first').length).toBe(1);

    })

    it('should get tagged with parent',()=>{

        const parent=createScope(reg=>{
            reg.implement(ICarType,()=>new Car('c'),['fast','first']);
        });
        const scope=parent.createChild(reg=>{
            reg.implement(ICarType,()=>new Car('a'),'fast');
            reg.implement(ICarType,()=>new Car('b'));
        });

        const car=scope.to(ICarType);

        expect(car()).toBeInstanceOf(Car);

        expect(car.all().length).toBe(3);
        expect(car.all('fast').length).toBe(2);
        expect(car.all('first').length).toBe(1);

    })

    it('should create observable',()=>{

        const scope=createScope();

        const car=scope.to(defineObservable<ICar>("car"));

        expect(car()).toBeUndefined()
        expect(car.subject).toBeInstanceOf(BehaviorSubject);

        let carValue:ICar|undefined=undefined;
        const sub=car.subject.subscribe(v=>{
            carValue=v;
        })

        expect(carValue).toBeUndefined();

        const carA=new Car();
        car.subject.next(carA);
        expect(carValue).toBe(carA);
        expect(car()).toBe(carA);

        const carB=new Car();
        car.subject.next(carB);
        expect(carValue).toBe(carB);
        expect(car()).toBe(carB);

        car.subject.next(undefined);
        expect(carValue).toBeUndefined();
        expect(car()).toBeUndefined();

        sub.unsubscribe();
        const carC=new Car();
        car.subject.next(carC);
        expect(carValue).toBeUndefined();
        expect(car()).toBe(carC);

    })

    it('should get direct scoped observable',()=>{

        const scopeA=createScope();
        const scopeB=createScope();

        const car=scopeA.to(defineObservable<ICar>("car",()=>new Car()));

        expect(car.subject).toBeInstanceOf(BehaviorSubject);

        const carA=car(scopeA);
        const carB=car(scopeB);

        expect(carA).toBeInstanceOf(Car);
        expect(carB).toBeInstanceOf(Car);

        expect(scopeA.subject(car)).toBeInstanceOf(BehaviorSubject);
        expect(scopeB.subject(car)).toBeInstanceOf(BehaviorSubject);

        expect(scopeA.subject(car)).toBe(scopeA.subject(car));
        expect(scopeA.subject(car)).not.toBe(scopeB.subject(car));

    })

    it('should create observable',()=>{

        const scope=createScope();

        const car=scope.to(defineObservable<ICar>("car"));

        expect(car()).toBeUndefined()
        expect(car.subject).toBeInstanceOf(BehaviorSubject);

        let carValue:ICar|undefined=undefined;
        const sub=car.subject.subscribe(v=>{
            carValue=v;
        })

        expect(carValue).toBeUndefined();

        const carA=new Car();
        car.subject.next(carA);
        expect(carValue).toBe(carA);
        expect(car()).toBe(carA);

        const carB=new Car();
        car.subject.next(carB);
        expect(carValue).toBe(carB);
        expect(car()).toBe(carB);

        car.subject.next(undefined);
        expect(carValue).toBeUndefined();
        expect(car()).toBeUndefined();

        sub.unsubscribe();
        const carC=new Car();
        car.subject.next(carC);
        expect(carValue).toBeUndefined();
        expect(car()).toBe(carC);

    })

    it('should create readonly observable',()=>{

        const scope=createScope();

        const setCar=createScopedSetter<Car|undefined>(scope);
        const car=scope.to(defineReadonlyObservable("car",setCar));


        expect(car()).toBeUndefined()
        expect(car.subject).toBeInstanceOf(BehaviorSubject);

        let carValue:ICar|undefined=undefined;
        const sub=car.subject.subscribe(v=>{
            carValue=v;
        })

        expect(carValue).toBeUndefined();

        const carA=new Car();
        setCar(carA);
        expect(carValue).toBe(carA);
        expect(car()).toBe(carA);

        const carB=new Car();
        setCar(carB);
        expect(carValue).toBe(carB);
        expect(car()).toBe(carB);

        setCar(undefined);
        expect(carValue).toBeUndefined();
        expect(car()).toBeUndefined();

        sub.unsubscribe();
        const carC=new Car();
        setCar(carC);
        expect(carValue).toBeUndefined();
        expect(car()).toBe(carC);

    })

    it('should get value from parent',()=>{

        const scope=createScope(reg=>{
            reg.implement(ICarType,()=>new Car());
        });
        const dec=scope.createChild().createChild().createChild();

        const car=dec.to(ICarType);

        expect(car()).toBeInstanceOf(Car);

    })

    it('should fail to require non provided type',()=>{

        const car=defineType<ICar>("car");

        try{
            car.require();
            fail('Require should have failed')
        }catch{
            //
        }

    })

    it('should scope type',()=>{

        const scopeA=createScope(reg=>{
            reg.implement(ICarType,()=>new Car('a'));
        });
        const scopeB=createScope(reg=>{
            reg.implement(ICarType,()=>new Car('b'));
        });

        const car=scopeA.to(ICarType);

        expect(car()).toBeInstanceOf(Car);
        expect(car().name).toBe('a');
        expect(car(scopeB).name).toBe('b');
        expect(scopeB.to(car).require().name).toBe('b');

        expect(scopeB.to(car)).toBe(scopeB.to(car))

    })

    it('should map types',()=>{

        const scopeA=createScope(reg=>{
            reg.implement(ICarType1,()=>new Car('A1'));
            reg.implement(ICarType2,()=>new Car('A2'));
            reg.implement(ICarType3,()=>new Car('A3'));
        });
        const scopeB=createScope(reg=>{
            reg.implement(ICarType1,()=>new Car('B1'));
            reg.implement(ICarType2,()=>new Car('B2'));
            reg.implement(ICarType3,()=>new Car('B3'));
        });

        const [source1,source2,source3]=scopeA.map(ICarType1,ICarType2,ICarType3);

        const [mapped1,mapped2,mapped3]=scopeB.map(ICarType1,ICarType2,ICarType3);

        expect(source1().name).toBe('A1');
        expect(source2().name).toBe('A2');
        expect(source3().name).toBe('A3');

        expect(mapped1().name).toBe('B1');
        expect(mapped2().name).toBe('B2');
        expect(mapped3().name).toBe('B3');

        const [remapped1,remapped2,remapped3]=scopeB.map(ICarType1,ICarType2,ICarType3);
        expect(mapped1).toBe(remapped1);
        expect(mapped2).toBe(remapped2);
        expect(mapped3).toBe(remapped3);

    })

    const hostValue='example.com';
    const portValue=8080;
    const logValue=true;
    const dataValue:JsonData={
        name:'Lucky',
        value:777,
    }
    const testValues=(scope:Scope,suffix:string='')=>{

        const host=defineStringParam('testHostName'+suffix);
        const port=defineNumberParam('testPort'+suffix);
        const log=defineBoolParam('testLog'+suffix);
        const data=defineParam<JsonData>('testJsonData'+suffix);

        expect(host(scope)).toBe(hostValue);
        expect(port(scope)).toBe(portValue);
        expect(log(scope)).toBe(logValue);
        expect(data(scope)).toEqual(dataValue);
        expect(data(scope)).toBe(data(scope));

    }

    it('should provide values using hashmap',()=>{

        const scope=createScope(reg=>{
            reg.addParams({
                TEST_HOST_NAME:hostValue,
                TEST_PORT:portValue.toString(),
                TEST_LOG:logValue.toString(),
                TEST_JSON_DATA:JSON.stringify(dataValue),
            })
        });

        testValues(scope);
    })

    it('should provide values using env',()=>{

        const scope=createScope(reg=>{
            reg.addParams(new EnvParams())
        });

        testValues(scope);
    })

    it('should provide values using env with NX_ prefix',()=>{

        const scope=createScope(reg=>{
            reg.addParams(new EnvParams())
        });

        testValues(scope,'_T2');
    })

    it('should init and dispose',async ()=>{

        const debugOrder=false;
        const log=(msg:string,order:number)=>{
            if(debugOrder){
                console.log(msg,order);
            }
        }

        const cancel=new CancelToken();
        let beforeCreate=-1;
        let initCall=-1;
        let afterReturn=-1;
        let initComplete=-1;
        let initedAll=-1;
        let afterAwaitInitPromise=-1;
        let disposed=-1;
        let afterCallCancel=-1;

        let callIndex=0;

        log('beforeCreate',callIndex);
        beforeCreate=callIndex++;
        const scope=createScope(reg=>{

            reg.use({
                async init(){
                    log('initCall',callIndex);
                    initCall=callIndex++;
                    await delayAsync(10);
                    log('initComplete',callIndex);
                    initComplete=callIndex++;
                },
                onAllInited(){
                    log('initedAll',callIndex);
                    initedAll=callIndex++;
                },
                dispose(){
                    log('disposed',callIndex);
                    disposed=callIndex++;
                }
            })
        },cancel);

        expect(scope.isInited()).toBe(false);

        log('afterReturn',callIndex);
        afterReturn=callIndex++;

        await scope.getInitPromise();

        expect(scope.isInited()).toBe(true);

        log('afterAwaitInitPromise',callIndex);
        afterAwaitInitPromise=callIndex++;

        cancel.cancelNow();

        log('afterCallCancel',callIndex);
        afterCallCancel=callIndex++;

        let expectIndex=0;
        expect(beforeCreate).toBe(expectIndex++);
        expect(initCall).toBe(expectIndex++);
        expect(afterReturn).toBe(expectIndex++);
        expect(initComplete).toBe(expectIndex++);
        expect(initedAll).toBe(expectIndex++);
        expect(afterAwaitInitPromise).toBe(expectIndex++);
        expect(disposed).toBe(expectIndex++);
        expect(afterCallCancel).toBe(expectIndex++);


    })

    it('should prevent late registration',async ()=>{

        let reg:ScopeRegistration|undefined;

        const scope=createScope(_reg=>{
            reg=_reg;
            _reg.use({
                async init(){
                    await delayAsync(1);
                },
            })
        });

        await scope.getInitPromise();

        expect(reg).toBeTruthy();

        try{
            reg?.implement(ICarType,()=>new Car('b'));
            fail('Late registration should have failed')
        }catch{
            //
        }
    })

    const testRoot=async (test:()=>Promise<void>|void)=>{
        try{
            resetScope(rootScope);

            await test();

        }finally{
            resetScope(rootScope);
        }
    }

    it('should reset root',async ()=>{

        await testRoot(()=>{
            const check=()=>{
                expect(ICarTypeRoot1.get()).toBeUndefined();
                expect(ICarTypeRoot2.get()).toBeUndefined();
                const defaultCarValue=ICarTypeRootWidthDefault();
                expect(defaultCarValue).toBeInstanceOf(Car);
                expect(defaultCarValue).toBe(ICarTypeRootWidthDefault());
                return defaultCarValue;
            }

            const a=check();

            resetScope(rootScope);

            const b=check();

            resetScope(rootScope);

            expect(a).not.toBe(b);
        })

    })

    it('should init root',async ()=>{


        testRoot(async ()=>{

            initRootScope(reg=>{
                reg.implement(ICarTypeRoot1,()=>new Car('a'));
                reg.implement(ICarTypeRoot2,()=>new Car('b'));
                reg.use({
                    init:async ()=>{
                        await delayAsync(10)
                    }
                });
            })

            expect(rootScope.isInited()).toBe(false);

            await rootScope.getInitPromise();

            expect(rootScope.isInited()).toBe(true);

            expect(ICarTypeRoot1().name).toBe('a');
            expect(ICarTypeRoot2().name).toBe('b');

        });

    })

})
