import { IyioLibBuilderExecutorSchema } from './schema';

export default async function runExecutor(
  options: IyioLibBuilderExecutorSchema,
) {
  console.log('Executor ran for IyioLibBuilder', options);
  return {
    success: true
  };
}

