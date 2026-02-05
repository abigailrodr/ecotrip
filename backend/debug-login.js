import pool from './src/config/database.js';
import { comparePassword } from './src/utils/password.js';

async function debugLogin() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Debugging login for test@example.com...\n');
    
    // Get user from database
    const result = await client.query(
      'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = $1',
      ['test@example.com']
    );
    
    if (result.rows.length === 0) {
      console.log('User not found!');
      process.exit(1);
    }
    
    const user = result.rows[0];
    console.log('User found:');
    console.log('   ID:', user.id);
    console.log('   Name:', user.name);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Active:', user.is_active);
    console.log('   Password hash length:', user.password_hash.length);
    console.log('   Password hash preview:', user.password_hash.substring(0, 20) + '...');
    console.log('');
    
    // Test password
    const testPassword = 'Test123';
    console.log(`Testing password: "${testPassword}"`);
    
    const isValid = await comparePassword(testPassword, user.password_hash);
    console.log('');
    
    if (isValid) {
      console.log('PASSWORD IS VALID! Login should work!');
    } else {
      console.log('PASSWORD IS INVALID! This is the problem.');
      console.log('');
      console.log('Let me check what passwords might work...');
      
      // Test common variations
      const variations = [
        'Test123',
        'test123',
        'TEST123',
        'Test@123',
        'test@example.com'
      ];
      
      for (const pwd of variations) {
        const valid = await comparePassword(pwd, user.password_hash);
        if (valid) {
          console.log(` This password works: "${pwd}"`);
        }
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error(' Error:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

debugLogin();
