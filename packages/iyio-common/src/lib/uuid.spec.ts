import { uuid } from "./uuid";

describe('uuid',()=>{

    it('generate UUID',()=>{
        const guid=uuid();

        // d382178b-4db9-4e70-80d0-e1506b0ea8d6
        expect(guid).toMatch(/[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}/);

    })

});
