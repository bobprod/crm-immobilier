const { runCLI } = require('jest');
async function main() {
    const config = require('../jest-e2e.json');
    console.log('Using config:', config);
    const res = await runCLI({ config: JSON.stringify(config), runInBand: true, listTests: true }, [process.cwd()]);
    console.log('Result keys:', Object.keys(res));
    console.log(JSON.stringify(res, null, 2));
}
main().catch(e => { console.error(e); process.exit(1); });
