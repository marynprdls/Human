import dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env from root project (not backend folder)
dotenv.config({ path: resolve(__dirname, '../../.env') });

import { createApp } from './app';
import { testConnection as testSupabase } from './config/supabase';
import { testConnection as testStellar } from './config/stellar';

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    console.log('🔌 Testing connections...');
    
    const supabaseOk = await testSupabase();
    const stellarOk = await testStellar();
    
    if (!supabaseOk || !stellarOk) {
      throw new Error('Failed to connect to services');
    }
    
    const app = createApp();
    
    app.listen(PORT, () => {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(` Backend running on http://localhost:${PORT}`);
      console.log(` Health: http://localhost:${PORT}/health`);
      console.log(` Network: ${process.env.PUBLIC_STELLAR_NETWORK || 'unknown'}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();