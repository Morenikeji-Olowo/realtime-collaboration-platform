import Redis from "ioredis";
import {env} from "./env.js"

const socketRedis = new Redis(env.REDIS_URL);

export default socketRedis;