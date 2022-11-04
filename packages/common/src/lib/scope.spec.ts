import { BehaviorSubject } from 'rxjs';
import { createScope, EnvValueProvider } from './scope-lib';
import { Scope } from './scope-types';
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

interface JsonData
{
    name:string;
    value:any;
}

describe('Scope',()=>{

    it('should define type',()=>{

        const scope=createScope();

        const car=scope.defineType<ICar>("car");

        scope.provideForType(car,()=>new Car());

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

        const car=scope.defineType<ICar>("car",()=>new Car());

        expect(car()).toBeInstanceOf(Car);

    })

    it('should define type with default provider and re-scope',()=>{

        const scopeA=createScope();
        const scopeB=createScope();

        const carA=scopeA.defineType<ICar>("car",()=>new Car());
        const carB=scopeB.to(carA);

        expect(carB()).toBeInstanceOf(Car);
        expect(carA()).toBeInstanceOf(Car);
        expect(carB()).not.toBe(carA());

    })

    it('should get re-scoped value',()=>{

        const scopeA=createScope();
        const scopeB=createScope();

        const carA=scopeA.defineType<ICar>("car",()=>new Car());

        expect(scopeB(carA)).toBeInstanceOf(Car);
        expect(carA()).toBeInstanceOf(Car);
        expect(scopeB(carA)).not.toBe(carA());

    })

    it('should create singleton',()=>{

        const scope=createScope();

        const car=scope.defineType<ICar>("car");

        scope.provideForType(car,()=>new Car());

        expect(car()).toBeInstanceOf(Car);

        const a=car();
        const b=car();
        const c=car();

        expect(a).toBe(b);
        expect(a).toBe(c);

    })

    it('should create using fluent',()=>{

        const scope=createScope();

        const car=scope.defineType<ICar>("car");
        const statusChecker=scope.defineType<IStatusChecker>("statusChecker");

        scope
            .provideForType(car,()=>new Car())
            .andFor(statusChecker);

        expect(car()).toBeInstanceOf(Car);
        expect(statusChecker()).toBeInstanceOf(Car);

        expect(car()).toBe(statusChecker());

    })

    it('should create factory',()=>{

        const scope=createScope();

        const car=scope.defineType<ICar>("car");

        scope.provideForType(car,{
            provider:()=>new Car(),
            isFactory:true
        });

        expect(car()).toBeInstanceOf(Car);

        const a=car();
        const b=car();
        const c=car();

        expect(a).not.toBe(b);
        expect(a).not.toBe(c);

    })

    it('should get all',()=>{

        const scope=createScope();

        const car=scope.defineType<ICar>("car");

        scope.provideForType(car,()=>new Car('a'));
        scope.provideForType(car,()=>new Car('b'));
        scope.provideForType(car,()=>new Car('c'));

        expect(car()).toBeInstanceOf(Car);

        expect(car.all().length).toBe(3);
        expect(car.all().find(c=>c.name==='a')).toBeTruthy();
        expect(car.all().find(c=>c.name==='b')).toBeTruthy();
        expect(car.all().find(c=>c.name==='c')).toBeTruthy();

    })

    it('should get tagged',()=>{

        const scope=createScope();

        const car=scope.defineType<ICar>("car");

        scope.provideForType(car,()=>new Car('a'),'fast');
        scope.provideForType(car,()=>new Car('b'));
        scope.provideForType(car,()=>new Car('c'),['fast','first']);

        expect(car()).toBeInstanceOf(Car);

        expect(car.all().length).toBe(3);
        expect(car.all('fast').length).toBe(2);
        expect(car.all('first').length).toBe(1);

    })

    it('should get tagged with parent',()=>{

        const parent=createScope();
        const scope=createScope(parent);

        const car=scope.defineType<ICar>("car");

        scope.provideForType(car,()=>new Car('a'),'fast');
        scope.provideForType(car,()=>new Car('b'));
        parent.provideForType(car,()=>new Car('c'),['fast','first']);

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

        const scope=createScope();
        const dec=createScope(createScope(createScope(createScope(scope))));

        const car=dec.defineType<ICar>("car");

        scope.provideForType(car,()=>new Car());

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

        const scopeA=createScope();
        const scopeB=createScope();

        const car=scopeA.defineType<ICar>("car");

        scopeA.provideForType(car,()=>new Car('a'));
        scopeB.provideForType(car,()=>new Car('b'));

        expect(car()).toBeInstanceOf(Car);
        expect(car().name).toBe('a');
        expect(scopeB(car).name).toBe('b');
        expect(scopeB.to(car).require().name).toBe('b');

        expect(scopeB.to(car)).toBe(scopeB.to(car))

    })

    it('should map types',()=>{

        const scopeA=createScope();
        const scopeB=createScope();

        const car1=scopeA.defineType<ICar>("car");
        const car2=scopeA.defineType<ICar>("car");
        const car3=scopeA.defineType<ICar>("car");

        scopeA.provideForType(car1,()=>new Car('A1'));
        scopeA.provideForType(car2,()=>new Car('A2'));
        scopeA.provideForType(car3,()=>new Car('A3'));

        scopeB.provideForType(car1,()=>new Car('B1'));
        scopeB.provideForType(car2,()=>new Car('B2'));
        scopeB.provideForType(car3,()=>new Car('B3'));

        const [mapped1,mapped2,mapped3]=scopeB.map(car1,car2,car3);

        expect(car1().name).toBe('A1');
        expect(car2().name).toBe('A2');
        expect(car3().name).toBe('A3');

        expect(mapped1().name).toBe('B1');
        expect(mapped2().name).toBe('B2');
        expect(mapped3().name).toBe('B3');

        const [remapped1,remapped2,remapped3]=scopeB.map(car1,car2,car3);
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

        const host=scope.defineString('TEST_HOST_NAME'+suffix);
        const port=scope.defineNumber('TEST_PORT'+suffix);
        const log=scope.defineBool('TEST_LOG'+suffix);
        const data=scope.defineValue<JsonData>('TEST_JSON_DATA'+suffix);

        expect(host()).toBe(hostValue);
        expect(port()).toBe(portValue);
        expect(log()).toBe(logValue);
        expect(data()).toEqual(dataValue);

        expect(data()).toBe(data());

    }

    it('should provide values using hashmap',()=>{

        const scope=createScope();
        scope.provideValues({
            TEST_HOST_NAME:hostValue,
            TEST_PORT:portValue.toString(),
            TEST_LOG:logValue.toString(),
            TEST_JSON_DATA:JSON.stringify(dataValue),
        })

        testValues(scope);
    })

    it('should provide values using env',()=>{

        const scope=createScope();
        scope.provideValues(new EnvValueProvider())

        testValues(scope);
    })

    it('should provide values using env with NX_ prefix',()=>{

        const scope=createScope();
        scope.provideValues(new EnvValueProvider())

        testValues(scope,'_T2');
    })

    it('should provide values using env with IY_ prefix',()=>{

        const scope=createScope();
        scope.provideValues(new EnvValueProvider('IY_'))

        testValues(scope,'_T3');
    })

})
