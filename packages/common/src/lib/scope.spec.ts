import { BehaviorSubject } from 'rxjs';
import { CancelToken } from './CancelToken';
import { delayAsync } from './common-lib';
import { createScope, defineService, EnvValueProvider } from './scope-lib';
import { Scope, ScopeRegistration } from './scope-types';
import { createScopedSetter } from './Setter';


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

const ICarType=defineService<ICar>("ICarType");
const ICarType1=defineService<ICar>("ICarType1");
const ICarType2=defineService<ICar>("ICarType2");
const ICarType3=defineService<ICar>("ICarType3");

const IStatusCheckerType=defineService<IStatusChecker>("IStatusCheckerType");

interface JsonData
{
    name:string;
    value:any;
}

describe('Scope',()=>{

    it('should define type',()=>{

        const scope=createScope(reg=>{
            reg.provideForType(ICarType,()=>new Car())
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

        const car=scope.defineService<ICar>("car",()=>new Car());

        expect(car()).toBeInstanceOf(Car);

    })

    it('should define type with default provider and re-scope',()=>{

        const scopeA=createScope();
        const scopeB=createScope();

        const carA=scopeA.defineService<ICar>("car",()=>new Car());
        const carB=scopeB.to(carA);

        expect(carB()).toBeInstanceOf(Car);
        expect(carA()).toBeInstanceOf(Car);
        expect(carB()).not.toBe(carA());

    })

    it('should get re-scoped value',()=>{

        const scopeA=createScope();
        const scopeB=createScope();

        const carA=scopeA.defineService<ICar>("car",()=>new Car());

        expect(scopeB(carA)).toBeInstanceOf(Car);
        expect(carA()).toBeInstanceOf(Car);
        expect(scopeB(carA)).not.toBe(carA());

    })

    it('should create singleton',()=>{

        const scope=createScope(reg=>{
            reg.provideForType(ICarType,()=>new Car())
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
            reg.provideForType(ICarType,()=>new Car())
                .andFor(IStatusCheckerType);
        });

        const car=scope.to(ICarType);
        const statusChecker=scope.to(IStatusCheckerType);


        expect(car()).toBeInstanceOf(Car);
        expect(statusChecker()).toBeInstanceOf(Car);

        expect(car()).toBe(statusChecker());

    })

    it('should create factory',()=>{

        const scope=createScope(reg=>{
            reg.provideForType(ICarType,{
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
            reg.provideForType(ICarType,()=>new Car('a'));
            reg.provideForType(ICarType,()=>new Car('b'));
            reg.provideForType(ICarType,()=>new Car('c'));
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
            reg.provideForType(ICarType,()=>new Car('a'),'fast');
            reg.provideForType(ICarType,()=>new Car('b'));
            reg.provideForType(ICarType,()=>new Car('c'),['fast','first']);
        });

        const car=scope.to(ICarType);


        expect(car()).toBeInstanceOf(Car);

        expect(car.all().length).toBe(3);
        expect(car.all('fast').length).toBe(2);
        expect(car.all('first').length).toBe(1);

    })

    it('should get tagged with parent',()=>{

        const parent=createScope(reg=>{
            reg.provideForType(ICarType,()=>new Car('c'),['fast','first']);
        });
        const scope=parent.createChild(reg=>{
            reg.provideForType(ICarType,()=>new Car('a'),'fast');
            reg.provideForType(ICarType,()=>new Car('b'));
        });

        const car=scope.to(ICarType);

        expect(car()).toBeInstanceOf(Car);

        expect(car.all().length).toBe(3);
        expect(car.all('fast').length).toBe(2);
        expect(car.all('first').length).toBe(1);

    })

    it('should create observable',()=>{

        const scope=createScope();

        const car=scope.defineObservable<ICar>("car");

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

        const car=scopeA.defineObservable<ICar>("car",()=>new Car());

        expect(car.subject).toBeInstanceOf(BehaviorSubject);

        const carA=scopeA(car);
        const carB=scopeB(car);

        expect(carA).toBeInstanceOf(Car);
        expect(carB).toBeInstanceOf(Car);

        expect(scopeA.subject(car)).toBeInstanceOf(BehaviorSubject);
        expect(scopeB.subject(car)).toBeInstanceOf(BehaviorSubject);

        expect(scopeA.subject(car)).toBe(scopeA.subject(car));
        expect(scopeA.subject(car)).not.toBe(scopeB.subject(car));

    })

    it('should create observable',()=>{

        const scope=createScope();

        const car=scope.defineObservable<ICar>("car");

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
        const car=scope.defineReadonlyObservable("car",setCar);


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
            reg.provideForType(ICarType,()=>new Car());
        });
        const dec=scope.createChild().createChild().createChild();

        const car=dec.to(ICarType);

        expect(car()).toBeInstanceOf(Car);

    })

    it('should fail to require non provided type',()=>{

        const scope=createScope();

        const car=scope.defineType<ICar>("car");

        try{
            car.require();
            fail('Require should have failed')
        }catch{
            //
        }

    })

    it('should scope type',()=>{

        const scopeA=createScope(reg=>{
            reg.provideForType(ICarType,()=>new Car('a'));
        });
        const scopeB=createScope(reg=>{
            reg.provideForType(ICarType,()=>new Car('b'));
        });

        const car=scopeA.to(ICarType);

        expect(car()).toBeInstanceOf(Car);
        expect(car().name).toBe('a');
        expect(scopeB(car).name).toBe('b');
        expect(scopeB.to(car).require().name).toBe('b');

        expect(scopeB.to(car)).toBe(scopeB.to(car))

    })

    it('should map types',()=>{

        const scopeA=createScope(reg=>{
            reg.provideForType(ICarType1,()=>new Car('A1'));
            reg.provideForType(ICarType2,()=>new Car('A2'));
            reg.provideForType(ICarType3,()=>new Car('A3'));
        });
        const scopeB=createScope(reg=>{
            reg.provideForType(ICarType1,()=>new Car('B1'));
            reg.provideForType(ICarType2,()=>new Car('B2'));
            reg.provideForType(ICarType3,()=>new Car('B3'));
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

        const host=scope.defineStringParam('TEST_HOST_NAME'+suffix);
        const port=scope.defineNumberParam('TEST_PORT'+suffix);
        const log=scope.defineBoolParam('TEST_LOG'+suffix);
        const data=scope.defineParam<JsonData>('TEST_JSON_DATA'+suffix);

        expect(host()).toBe(hostValue);
        expect(port()).toBe(portValue);
        expect(log()).toBe(logValue);
        expect(data()).toEqual(dataValue);

        expect(data()).toBe(data());

    }

    it('should provide values using hashmap',()=>{

        const scope=createScope(reg=>{
            reg.provideParams({
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
            reg.provideParams(new EnvValueProvider())
        });

        testValues(scope);
    })

    it('should provide values using env with NX_ prefix',()=>{

        const scope=createScope(reg=>{
            reg.provideParams(new EnvValueProvider())
        });

        testValues(scope,'_T2');
    })

    it('should provide values using env with IY_ prefix',()=>{

        const scope=createScope(reg=>{
            reg.provideParams(new EnvValueProvider('IY_'))
        });

        testValues(scope,'_T3');
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
        const scope=createScope(()=>{

            return {
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
            }
        },cancel);

        expect(scope.isInited()).toBe(false);

        log('afterReturn',callIndex);
        afterReturn=callIndex++;

        await scope.initPromise;

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
            return {
                async init(){
                    await delayAsync(1);
                },
            }
        });

        await scope.initPromise;

        expect(reg).toBeTruthy();

        try{
            reg?.provideForType(ICarType,()=>new Car('b'));
            fail('Late registration should have failed')
        }catch{
            //
        }


    })

})
