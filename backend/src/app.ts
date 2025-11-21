import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import routes from './routes';

export function createApp(): Application {
  const app = express();
  
  // Middleware
  app.use(helmet());
  app.use(cors({ 
    origin: process.env.PUBLIC_STELLAR_NETWORK === 'TESTNET' 
      ? ['http://localhost:5173', 'http://localhost:3000']
      : ['https://your-production-domain.com']
  }));
  app.use(express.json());
  app.use(compression());
  
  // Health check
  app.get('/health', (req: Request, res: Response) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      network: process.env.PUBLIC_STELLAR_NETWORK || 'unknown'
    });
  });
  
  // API Routes
  app.use('/api', routes);
  
  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
  });
  
  return app;
}
