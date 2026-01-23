const { Pool } = require('pg');
async function listTables() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: false
    });
    try {
        const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log("Tables:", res.rows.map(r => r.table_name));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
listTables();
