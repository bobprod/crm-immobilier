const fs = require('fs');
const cp = require('child_process');
const path = require('path');
try {
    const repoRoot = process.cwd();
    const backendDir = path.join(repoRoot, 'backend');
    if (!fs.existsSync(backendDir)) throw new Error('backend dir not found: ' + backendDir);
    process.chdir(backendDir);

    const localSchema = fs.readFileSync('prisma/schema.prisma', 'utf8');
    console.log('Loaded local schema.prisma');

    let dbSchema = '';
    try {
        dbSchema = cp.execSync('npx prisma db pull --print --schema=prisma/schema.prisma', { encoding: 'utf8', maxBuffer: 1024 * 1024 * 20 });
        console.log('Pulled DB schema');
    } catch (e) {
        console.error('prisma db pull failed:', e.message);
        // continue with empty dbSchema
    }

    function parseModels(schemaText) {
        const models = {};
        if (!schemaText) return models;
        const regex = /model\s+([A-Za-z0-9_]+)\s*\{([\s\S]*?)\n\}/g;
        let m;
        while ((m = regex.exec(schemaText))) {
            const name = m[1];
            const body = m[2];
            const mapMatch = body.match(/@@map\((?:"|')([^"')]+)(?:"|')\)/);
            models[name] = { map: mapMatch ? mapMatch[1] : null };
        }
        return models;
    }

    const localModels = parseModels(localSchema);
    const dbModels = parseModels(dbSchema);

    const report = { missing_in_db: [], mismatched_map: [], extra_in_db: [], local_count: Object.keys(localModels).length, db_count: Object.keys(dbModels).length };

    for (const name of Object.keys(localModels)) {
        if (dbModels[name]) {
            const lm = localModels[name].map;
            const dm = dbModels[name].map;
            if (lm !== dm) report.mismatched_map.push({ model: name, local_map: lm, db_map: dm });
        } else {
            const lm = localModels[name].map;
            if (lm) {
                const found = Object.entries(dbModels).find(([k, v]) => v.map === lm);
                if (found) {
                    report.mismatched_map.push({ model: name, local_map: lm, db_model: found[0], db_map: found[1].map });
                    continue;
                }
            }
            const ci = Object.keys(dbModels).find(k => k.toLowerCase() === name.toLowerCase());
            if (ci) {
                report.mismatched_map.push({ model: name, local_map: localModels[name].map, db_model: ci, db_map: dbModels[ci].map });
                continue;
            }
            report.missing_in_db.push({ model: name, local_map: localModels[name].map });
        }
    }

    for (const name of Object.keys(dbModels)) {
        if (!localModels[name]) {
            const map = dbModels[name].map;
            const found = Object.entries(localModels).find(([k, v]) => v.map === map);
            if (found) {
                report.mismatched_map.push({ db_model: name, db_map: map, local_model: found[0], local_map: found[1].map });
                continue;
            }
            report.extra_in_db.push({ db_model: name, db_map: map });
        }
    }

    const outDir = path.join(backendDir, '..', 'analysis');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
    fs.writeFileSync(path.join(outDir, 'prisma-db-inventory.json'), JSON.stringify(report, null, 2));

    let md = '# Inventaire Prisma vs DB\n\n';
    md += `Local models: ${report.local_count}  \nDB models (pulled): ${report.db_count}  \n\n`;
    md += '## Mismatched or mapped models\n\n';
    report.mismatched_map.forEach(it => { md += `- ${JSON.stringify(it)}\n`; });
    md += '\n## Missing in DB\n\n';
    report.missing_in_db.forEach(it => { md += `- ${JSON.stringify(it)}\n`; });
    md += '\n## Extra in DB\n\n';
    report.extra_in_db.forEach(it => { md += `- ${JSON.stringify(it)}\n`; });
    fs.writeFileSync(path.join(outDir, 'prisma-db-inventory.md'), md);
    console.log('Wrote inventory to analysis/prisma-db-inventory.*');

    // FRONTEND scan
    const frontendDir = path.join(backendDir, '..', 'frontend');
    const frontendSrc = path.join(frontendDir, 'src');
    const frontendReport = { top_level: [], pages: [], components: [] };
    if (fs.existsSync(frontendSrc)) {
        const entries = fs.readdirSync(frontendSrc, { withFileTypes: true });
        entries.forEach(e => { frontendReport.top_level.push(e.name); });

        const pagesDir = [path.join(frontendDir, 'pages'), path.join(frontendSrc, 'pages'), path.join(frontendSrc, 'app')].find(p => fs.existsSync(p));
        if (pagesDir) {
            function walk(d) {
                const list = [];
                fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
                    const p = path.join(d, e.name);
                    if (e.isDirectory()) list.push({ dir: e.name, children: walk(p) });
                    else list.push(e.name);
                });
                return list;
            }
            frontendReport.pages = walk(pagesDir);
        }
        const compDir = path.join(frontendSrc, 'components');
        if (fs.existsSync(compDir)) frontendReport.components = fs.readdirSync(compDir);
    } else {
        // try legacy frontend (root 'frontend')
        if (fs.existsSync(path.join(frontendDir, 'pages'))) frontendReport.top_level.push('pages (outside src)');
    }

    fs.writeFileSync(path.join(outDir, 'frontend-modules.json'), JSON.stringify(frontendReport, null, 2));
    let md2 = '# Frontend modules inventory\n\n';
    md2 += 'Top level entries in `frontend/src`:\n\n'; frontendReport.top_level.forEach(n => md2 += `- ${n}\n`);
    md2 += '\nPages/app structure (partial):\n\n'; md2 += JSON.stringify(frontendReport.pages, null, 2);
    md2 += '\n\nComponents dir listing:\n\n'; md2 += JSON.stringify(frontendReport.components, null, 2);
    fs.writeFileSync(path.join(outDir, 'frontend-modules.md'), md2);
    console.log('Wrote frontend modules to analysis/frontend-modules.*');
    console.log('Done');
} catch (err) {
    console.error('ERROR', err.stack || err.message);
    process.exit(1);
}
