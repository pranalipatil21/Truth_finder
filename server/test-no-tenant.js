const { Client } = require('pg');

const url = `postgresql://postgres:Skill%40123%40%21@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`;
const client = new Client({ connectionString: url });
client.connect().then(() => console.log("CONNECTED")).catch(console.error).finally(()=>client.end());
