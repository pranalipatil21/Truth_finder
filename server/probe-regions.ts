import { Client } from 'pg';

const regions = [
    'aws-0-us-east-1', 'aws-0-us-east-2', 'aws-0-us-west-1', 'aws-0-us-west-2',
    'aws-0-ap-southeast-1', 'aws-0-ap-southeast-2', 'aws-0-ap-south-1',
    'aws-0-ap-northeast-1', 'aws-0-ap-northeast-2', 'aws-0-ap-northeast-3',
    'aws-0-eu-central-1', 'aws-0-eu-west-1', 'aws-0-eu-west-2', 'aws-0-eu-west-3', 'aws-0-eu-north-1',
    'aws-0-sa-east-1', 'aws-0-ca-central-1', 'aws-0-me-central-1', 'aws-0-af-south-1',
    'gcp-0-us-central-1', 'gcp-0-europe-west-3'
];

const projectRef = 'vxloitfhatxtcomaiejs';
const password = 'Skill@123@!';

async function probe() {
    for (const region of regions) {
        const host = `${region}.pooler.supabase.com`;
        for (const port of [6543, 5432]) {
            console.log(`Probing ${region} (${host}) on port ${port}...`);
            const client = new Client({
                host,
                port,
                user: `postgres.${projectRef}`,
                password,
                database: 'postgres',
                ssl: { rejectUnauthorized: false },
                connectionTimeoutMillis: 3000
            });

            try {
                await client.connect();
                console.log(`✅ SUCCESS: host=${host}, port=${port}`);
                await client.end();
                process.exit(0);
            } catch (err: any) {
                console.log(`❌ FAILED: ${err.message}`);
                try { await client.end(); } catch { }
            }
        }
    }
    console.log('All regions failed.');
    process.exit(1);
}

probe();
