import 'dotenv/config';
import dns from 'node:dns';
import { createServer } from './server.js';

dns.setDefaultResultOrder('ipv4first');

const server = await createServer();

server.start();