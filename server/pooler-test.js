const { Client } = require('pg');

const regions = [
  'ap-south-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'eu-north-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'sa-east-1',
  'ca-central-1'
];

async function testRegions() {
  for (const region of regions) {
    const url = `postgresql://postgres.vxloitfhatxtcomaiejs:Skill%40123%40%21@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true`;

    const client = new Client({ connectionString: url, connectionTimeoutMillis: 2000 });
    try {
      await client.connect();
      console.log(`SUCCESS: ${region} is the correct region!`);
      await client.end();
      process.exit(0);
    } catch (e) {
      if (e.message.includes('Tenant or user not found')) {
        console.log(`FAILED: ${region} (Pooler reached, but tenant not found)`);
      } else {
        console.log(`FAILED: ${region} (${e.message})`);
      }
    }
  }
}

testRegions();
