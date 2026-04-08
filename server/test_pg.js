const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:Skill%40123%40%21@db.vxloitfhatxtcomaiejs.supabase.co:5432/postgres',
    connectionTimeoutMillis: 5000
});

async function testConnection() {
    try {
        console.log('Connecting...');
        await client.connect();
        console.log('Connected directly!');

        const res = await client.query('SELECT NOW()');
        console.log(res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('Connection error', err.stack);
    }
}

testConnection();
