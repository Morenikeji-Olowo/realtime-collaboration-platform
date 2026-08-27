import 'dotenv/config';

import { createServer } from './server.js';

const server = await createServer();
server.start();