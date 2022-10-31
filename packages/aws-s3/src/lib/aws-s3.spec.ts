import { awsS3 } from './aws-s3';

describe('awsS3', () => {
    it('should work', () => {
        expect(awsS3()).toEqual('aws-s3');
    });
});
