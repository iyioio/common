import { awsDynamo } from './aws-dynamo';

describe('awsDynamo', () => {
    it('should work', () => {
        expect(awsDynamo()).toEqual('aws-dynamo');
    });
});
