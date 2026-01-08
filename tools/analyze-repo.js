const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'ANALYSIS_AUTOGEN.md');

const IGNORE = new Set(['.git', 'node_modules', 'dist', '.next', 'uploads', 'playwright-report']);

function walk(dir, fileList = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        if (IGNORE.has(e.name)) continue;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) walk(full, fileList);
        else fileList.push(full);
    }
    return fileList;
}

function head(file, n = 300) {
    try {
        const s = fs.readFileSync(file, 'utf8');
        return s.slice(0, n).replace(/\r/g, '');
    } catch (err) {
        return '';
    }
}

function fmtDate(d) {
    return new Date(d).toISOString();
}

function main() {
    const all = walk(ROOT);
    const md = all.filter(f => f.endsWith('.md')).sort();
    const key = [];

    const backendDir = path.join(ROOT, 'backend');
    const frontendDir = path.join(ROOT, 'frontend');
    const prisma = path.join(backendDir, 'prisma', 'schema.prisma');

    if (fs.existsSync(backendDir)) key.push(backendDir);
    if (fs.existsSync(frontendDir)) key.push(frontendDir);
    if (fs.existsSync(prisma)) key.push(prisma);

    const lines = [];
    lines.push('# ANALYSIS_AUTOGEN - Résumé automatique');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('\n## Markdown files (found)');
    for (const f of md) {
        const st = fs.statSync(f);
        lines.push(`- ${path.relative(ROOT, f)}  —  mtime: ${fmtDate(st.mtime)}`);
    }

    lines.push('\n## Key paths scanned');
    for (const p of key) {
        if (fs.existsSync(p)) {
            const st = fs.statSync(p);
            lines.push(`- ${path.relative(ROOT, p)}  —  mtime: ${fmtDate(st.mtime)}`);
        }
    }

    lines.push('\n## Top of selected files');
    const sample = md.slice(0, 12);
    for (const f of sample) {
        lines.push(`\n### ${path.relative(ROOT, f)}`);
        lines.push('```');
        lines.push(head(f, 800));
        lines.push('```');
    }

    // Add small backend/frontend inventory
    lines.push('\n## Backend src top-level (if exists)');
    const backendSrc = path.join(backendDir, 'src');
    if (fs.existsSync(backendSrc)) {
        const files = fs.readdirSync(backendSrc).slice(0, 60);
        for (const f of files) lines.push(`- ${path.relative(ROOT, path.join('backend', 'src', f))}`);
    }

    lines.push('\n## Frontend src top-level (if exists)');
    const frontendSrc = path.join(frontendDir, 'src');
    if (fs.existsSync(frontendSrc)) {
        const files = fs.readdirSync(frontendSrc).slice(0, 60);
        for (const f of files) lines.push(`- ${path.relative(ROOT, path.join('frontend', 'src', f))}`);
    }

    fs.writeFileSync(OUT, lines.join('\n'), 'utf8');
    console.log('Wrote', OUT);
}

if (require.main === module) main();
