import { worker } from '../src/worker';

worker.run().catch((error) => {
    console.error(error);
    process.exit(1);
});
