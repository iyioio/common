import { IyioLibBuilderExecutorSchema } from './schema';
import executor from './executor';

const options: IyioLibBuilderExecutorSchema = {};

describe('IyioLibBuilder Executor', () => {
  it('can run', async () => {
    const output = await executor(options);
    expect(output.success).toBe(true);
  });
});