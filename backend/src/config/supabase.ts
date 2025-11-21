import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function testConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('artisans').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Supabase connected');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
}