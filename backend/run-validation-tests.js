#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running UnifiedValidationService Tests\n');

const testFiles = [
    'src/shared/validation/unified-validation.service.spec.ts',
    'test/unified-validation.quick.spec.ts',
];

testFiles.forEach((file) => {
    const fullPath = path.join(__dirname, file);
    console.log(`\n📝 Testing: ${file}`);

    try {
        const result = execSync(
            `npx jest "${file}"`,
            { encoding: 'utf-8', stdio: 'pipe' }
        );
        console.log(result);
    } catch (error) {
        console.error(`❌ Error testing ${file}:`);
        console.error(error.stdout || error.stderr || error.message);
    }
});
