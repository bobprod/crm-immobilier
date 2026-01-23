const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function checkAdmin() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: false
    });

    try {
        const res = await pool.query("SELECT * FROM users WHERE email = 'admin@crm.com'");
        if (res.rows.length === 0) {
            console.log("Admin user NOT FOUND");

            // Try to create it manually
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await pool.query(
                "INSERT INTO users (id, email, password, \"firstName\", \"lastName\", role, \"createdAt\", \"updatedAt\") VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())",
                ['admin-id-1', 'admin@crm.com', hashedPassword, 'Admin', 'CRM', 'ADMIN']
            );
            console.log("Admin user CREATED with password admin123");
        } else {
            const user = res.rows[0];
            console.log("Admin user found:", user.email);
            console.log("Role:", user.role);

            // Verify password
            const isMatch = await bcrypt.compare('admin123', user.password);
            console.log("Password 'admin123' matches:", isMatch);

            if (!isMatch || user.role !== 'ADMIN') {
                console.log("Updating admin password/role...");
                const hashedPassword = await bcrypt.hash('admin123', 10);
                await pool.query(
                    "UPDATE users SET password = $1, role = $2 WHERE email = 'admin@crm.com'",
                    [hashedPassword, 'ADMIN']
                );
                console.log("Admin user UPDATED");
            }
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

checkAdmin();
