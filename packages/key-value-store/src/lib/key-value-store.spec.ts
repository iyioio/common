import { shortUuid } from '@iyio/common';
import { MemoryStore } from './MemoryStory';

interface Person
{
    id:string;
    name:string;
}

describe('key value store',()=>{

    const frankKey='/people/frank';
    const createFrank=():Person=>({
        id:shortUuid(),
        name:'Frank'
    })


    test('put, get, delete',async ()=>{
        const store=new MemoryStore<Person>({cloneValues:true});

        const frank=createFrank();

        await store.putAsync(frankKey,frank);
        expect(await store.getAsync(frankKey)).toEqual(frank);

        await store.deleteAsync(frankKey);
        expect(await store.getAsync(frankKey)).toBeUndefined();

    });


    test('watch',async ()=>{

        const store=new MemoryStore<Person>({cloneValues:true});
        expect(store.getWatchCount()).toBe(0);

        const frank=createFrank();

        const pointer=store.watch(frankKey);
        let subValue:Person|undefined;
        const unsub=pointer?.subject.subscribe((v)=>{
            subValue=v;
        })
        expect(pointer).toBeTruthy();
        expect(pointer?.value).toBeUndefined();
        expect(subValue).toBeUndefined();
        expect(store.getWatchCount()).toBe(1);


        await store.putAsync(frankKey,frank);
        expect(pointer?.value).toEqual(frank);
        expect(subValue).toEqual(frank);

        const pointer2=store.watch(frankKey);
        expect(pointer2).toBeTruthy();
        expect(pointer2?.value).toEqual(frank);
        expect(store.getWatchCount()).toBe(1);

        const bob:Person={
            id:shortUuid(),
            name:'Bob'
        }
        await store.putAsync(frankKey,bob);
        expect(pointer?.value).toEqual(bob);
        expect(subValue).toEqual(bob);

        await store.deleteAsync(frankKey);
        expect(pointer?.value).toBeUndefined();
        expect(subValue).toBeUndefined();

        unsub?.unsubscribe();

        pointer?.dispose();
        expect(store.getWatchCount()).toBe(1);
        pointer2?.dispose();
        expect(store.getWatchCount()).toBe(0);

    })

})
