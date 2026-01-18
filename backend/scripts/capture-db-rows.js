const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function loadDatabaseUrl() {
    if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
    const envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) return null;
    const env = fs.readFileSync(envPath, 'utf8');
    const match = env.match(/^DATABASE_URL=(.+)$/m);
    return match ? match[1].trim().replace(/\r?\n$/, '') : null;
}

(async function main() {
    const DATABASE_URL = loadDatabaseUrl();
    if (!DATABASE_URL) {
        console.error('DATABASE_URL not found in environment or backend/.env');
        process.exit(2);
    }

    const client = new Client({ connectionString: DATABASE_URL });
    await client.connect();

    const results = {};

    try {
        results.connection = await client.query('SELECT current_database() AS db, current_user AS user;');

        results.tables = await client.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name LIMIT 100;");

        const sampleTables = ['provider_configs', 'whatsapp_configs', 'agency_api_keys'];
        results.counts = {};
        for (const t of sampleTables) {
            try {
                const r = await client.query(`SELECT COUNT(*)::bigint AS cnt FROM ${t};`);
                results.counts[t] = r.rows[0].cnt;
            } catch (err) {
                results.counts[t] = { error: String(err) };
            }
        }

        results.samples = {};
        for (const t of sampleTables) {
            try {
                const r = await client.query(`SELECT * FROM ${t} LIMIT 5;`);
                results.samples[t] = r.rows;
            } catch (err) {
                results.samples[t] = { error: String(err) };
            }
        }

    } finally {
        await client.end();
    }

    const outDir = path.join(__dirname, '..', '..', 'analysis');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const jsonPath = path.join(outDir, 'db-read-rows.json');
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf8');

    const mdPath = path.join(outDir, 'db-read-rows.md');
    const md = [];
    md.push('# DB Read Rows Capture — ' + new Date().toISOString());
    md.push('');
    md.push('## Connection');
    md.push(JSON.stringify(results.connection.rows, null, 2));
    md.push('');
    md.push('## Tables (first 100)');
    md.push(results.tables.rows.map(r => `- ${r.table_schema}.${r.table_name}`).join('\n'));
    md.push('');
    md.push('## Counts');
    md.push('');
    for (const k of Object.keys(results.counts)) {
        md.push(`- ${k}: ${typeof results.counts[k] === 'object' ? JSON.stringify(results.counts[k]) : results.counts[k]}`);
    }
    md.push('');
    md.push('## Samples');
    for (const k of Object.keys(results.samples)) {
        md.push('### ' + k);
        md.push(JSON.stringify(results.samples[k], null, 2));
        md.push('');
    }

    fs.writeFileSync(mdPath, md.join('\n'), 'utf8');
    console.log('Wrote:', jsonPath, mdPath);
})();
