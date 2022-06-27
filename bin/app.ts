import { worker } from '../src/worker';

worker.run().catch((error) => {
  throw error;
});
