import { BehaviorSubject } from 'rxjs';
import { globalDeps } from './globalDeps';
import { createScope, EnvValueProvider } from './scope-lib';
import { Scope } from './scope-types';
import { createSetter } from './Setter';


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

class Car implements ICar
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

        scope.provideType(car,()=>new Car());

        expect(car()).toBeInstanceOf(Car);

        expect(car().speed).toBeUndefined();
        car().go('fast');
        expect(car().speed).toBe<Speed>('fast');

        expect(car().direction).toBeUndefined();
        car().turn('left');
        expect(car().direction).toBe<Direction>('left');

    })

    it('should create singleton',()=>{

        const scope=createScope();

        const car=scope.defineType<ICar>("car");

        scope.provideType(car,()=>new Car());

        expect(car()).toBeInstanceOf(Car);

        const a=car();
        const b=car();
        const c=car();

        expect(a).toBe(b);
        expect(a).toBe(c);

    })

    it('should create factory',()=>{

        const scope=createScope();

        const car=scope.defineType<ICar>("car");

        scope.provideType(car,{
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

        scope.provideType(car,()=>new Car('a'));
        scope.provideType(car,()=>new Car('b'));
        scope.provideType(car,()=>new Car('c'));

        expect(car()).toBeInstanceOf(Car);

        expect(car.all().length).toBe(3);
        expect(car.all().find(c=>c.name==='a')).toBeTruthy();
        expect(car.all().find(c=>c.name==='b')).toBeTruthy();
        expect(car.all().find(c=>c.name==='c')).toBeTruthy();

    })

    it('should get tagged',()=>{

        const scope=createScope();

        const car=scope.defineType<ICar>("car");

        scope.provideType(car,()=>new Car('a'),'fast');
        scope.provideType(car,()=>new Car('b'));
        scope.provideType(car,()=>new Car('c'),['fast','first']);

        expect(car()).toBeInstanceOf(Car);

        expect(car.all().length).toBe(3);
        expect(car.all('fast').length).toBe(2);
        expect(car.all('first').length).toBe(1);

    })

    it('should get tagged with parent',()=>{

        const parent=createScope();
        const scope=createScope(parent);

        const car=scope.defineType<ICar>("car");

        scope.provideType(car,()=>new Car('a'),'fast');
        scope.provideType(car,()=>new Car('b'));
        parent.provideType(car,()=>new Car('c'),['fast','first']);

        expect(car()).toBeInstanceOf(Car);

        expect(car.all().length).toBe(3);
        expect(car.all('fast').length).toBe(2);
        expect(car.all('first').length).toBe(1);

    })

    it('should create observable',()=>{

        const scope=createScope();

        const car=scope.defineObservable<ICar>("car");

        expect(car()).toBeInstanceOf(BehaviorSubject);

        let carValue:ICar|undefined=undefined;
        const sub=car().subscribe(v=>{
            carValue=v;
        })

        expect(carValue).toBeUndefined();

        const carA=new Car();
        car().next(carA);
        expect(carValue).toBe(carA);

        const carB=new Car();
        car().next(carB);
        expect(carValue).toBe(carB);

        car().next(undefined);
        expect(carValue).toBeUndefined();

        sub.unsubscribe();
        car().next(new Car());
        expect(carValue).toBeUndefined();

    })

    it('should create readonly observable',()=>{

        const scope=createScope();

        const setCar=createSetter<Car|undefined>();
        const car=scope.defineReadonlyObservable("car",setCar);

        expect(car()).toBeInstanceOf(BehaviorSubject);

        let carValue:ICar|undefined=undefined;
        const sub=car().subscribe(v=>{
            carValue=v;
        })

        expect(carValue).toBeUndefined();

        const carA=new Car();
        setCar(globalDeps,carA);
        expect(carValue).toBe(carA);

        const carB=new Car();
        setCar(globalDeps,carB);
        expect(carValue).toBe(carB);

        setCar(globalDeps,undefined);
        expect(carValue).toBeUndefined();

        sub.unsubscribe();
        setCar(globalDeps,new Car());
        expect(carValue).toBeUndefined();

    })

    it('should get value from parent',()=>{

        const scope=createScope();
        const dec=createScope(createScope(createScope(createScope(scope))));

        const car=dec.defineType<ICar>("car");

        scope.provideType(car,()=>new Car());

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

        scopeA.provideType(car,()=>new Car('a'));
        scopeB.provideType(car,()=>new Car('b'));

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

        scopeA.provideType(car1,()=>new Car('A1'));
        scopeA.provideType(car2,()=>new Car('A2'));
        scopeA.provideType(car3,()=>new Car('A3'));

        scopeB.provideType(car1,()=>new Car('B1'));
        scopeB.provideType(car2,()=>new Car('B2'));
        scopeB.provideType(car3,()=>new Car('B3'));

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
