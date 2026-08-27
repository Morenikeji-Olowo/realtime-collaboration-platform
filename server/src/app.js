import express from 'express'
import { errorHandler } from './middleware/error.js'
import authRoutes from './routes/auth.routes.js';
import pinoHttp from 'pino-http';
import usersRoutes from './routes/users.routes.js';
import workspaceRoutes from './routes/workspace.routes.js';

const app = express()
app.use(pinoHttp());
app.disable('x-powered-by')
app.use(express.json({limit: '1mb'}))

app.get('/health', (req, res)=>{
    res.status(200).json({status: 'ok'})
})
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/workspaces', workspaceRoutes);

app.use(errorHandler)

export default app;
