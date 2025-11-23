import { supabase } from './src/config/supabase';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration(migrationFile: string) {
  try {
    console.log(`\n🔄 Running migration: ${migrationFile}`);

    const sqlPath = path.join(__dirname, 'migrations', migrationFile);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL by semicolons and run each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`\n📝 Executing SQL:\n${statement.substring(0, 100)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          console.error('❌ Error:', error);
          // Try using raw query if RPC fails
          console.log('⚠️  Trying raw query...');
          const { error: rawError } = await supabase.from('_migrations').select('*').limit(0);
          console.error('⚠️  Note: You may need to run this migration manually in Supabase SQL Editor');
        } else {
          console.log('✅ Statement executed successfully');
        }
      }
    }

    console.log(`\n✅ Migration ${migrationFile} completed`);

  } catch (error) {
    console.error(`\n❌ Migration failed:`, error);
    console.log('\n📋 Please run the migration manually in Supabase SQL Editor:');
    console.log(`   File: backend/migrations/${migrationFile}`);
  }
}

async function main() {
  console.log('🚀 Starting database migration...\n');

  // Check connection
  console.log('🔍 Testing Supabase connection...');
  const { error } = await supabase.from('orders').select('*').limit(0);

  if (error) {
    console.error('❌ Cannot connect to Supabase:', error);
    console.log('\n⚠️  Please check your .env file:');
    console.log('   - PUBLIC_SUPABASE_URL');
    console.log('   - PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  console.log('✅ Connected to Supabase\n');

  // Run migration
  await runMigration('002_fix_orders_schema.sql');

  // Verify schema
  console.log('\n🔍 Verifying schema...');
  const { data: columns, error: schemaError } = await supabase
    .rpc('get_column_info', { table_name: 'orders' })
    .select('*');

  if (!schemaError && columns) {
    console.log('\n📊 Orders table columns:');
    console.table(columns);
  } else {
    // Alternative verification
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .limit(1);

    if (orders && orders.length > 0) {
      console.log('\n📊 Sample order structure:');
      console.log(Object.keys(orders[0]));
    }
  }

  console.log('\n✅ Migration process complete!');
  console.log('\n📋 Next steps:');
  console.log('   1. If migration failed, run the SQL manually in Supabase');
  console.log('   2. Restart the backend server');
  console.log('   3. Test QR generation');
}

main();
