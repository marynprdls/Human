import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import routes from './routes';

export function createApp(): Application {
  const app = express();
  
  // Middleware
  app.use(helmet());
  // CORS - Allow all origins in testnet for development
  app.use(cors({
    origin: process.env.PUBLIC_STELLAR_NETWORK === 'TESTNET'
      ? true // Allow all origins in development
      : ['https://your-production-domain.com'],
    credentials: true
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
  
  // Frontend logging endpoint
  app.post('/api/logs', (req: Request, res: Response) => {
    const { level, message, data } = req.body;

    // Print to terminal with colors/emojis
    if (level === 'error') {
      console.error(`[FRONTEND] ${message}`, data || '');
    } else if (level === 'warn') {
      console.warn(`[FRONTEND] ${message}`, data || '');
    } else {
      console.log(`[FRONTEND] ${message}`, data || '');
    }

    res.json({ received: true });
  });

  // API Routes
  app.use('/api', routes);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
  });
  
  return app;
}
