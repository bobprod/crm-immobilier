import { UnifiedValidationService } from './src/shared/validation/unified-validation.service';

async function runTests() {
    console.log('🧪 Testing UnifiedValidationService\n');

    const service = new UnifiedValidationService();
    let passed = 0;
    let failed = 0;

    // Test 1: Email Validation
    console.log('Test 1: Valid Email');
    try {
        const result = await service.validateEmail('test@example.com');
        if (result.isValid && result.format.hasValidFormat) {
            console.log('✅ PASS');
            passed++;
        } else {
            console.log('❌ FAIL');
            failed++;
        }
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        failed++;
    }

    // Test 2: Invalid Email
    console.log('\nTest 2: Invalid Email');
    try {
        const result = await service.validateEmail('invalid-email');
        if (!result.isValid) {
            console.log('✅ PASS');
            passed++;
        } else {
            console.log('❌ FAIL');
            failed++;
        }
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        failed++;
    }

    // Test 3: Disposable Email
    console.log('\nTest 3: Disposable Email Detection');
    try {
        const result = await service.validateEmail('test@tempmail.com');
        if (result.format.isDisposable && result.risk.isSpam) {
            console.log('✅ PASS');
            passed++;
        } else {
            console.log('❌ FAIL');
            failed++;
        }
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        failed++;
    }

    // Test 4: Tunisian Phone
    console.log('\nTest 4: Tunisian Mobile Validation');
    try {
        const result = await service.validatePhone('20123456', 'TN');
        if (result.isValid && result.details.type === 'mobile' && result.normalized.e164 === '+21620123456') {
            console.log('✅ PASS');
            passed++;
        } else {
            console.log('❌ FAIL - Result:', JSON.stringify(result, null, 2));
            failed++;
        }
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        failed++;
    }

    // Test 5: Carrier Detection
    console.log('\nTest 5: Carrier Detection');
    try {
        const result = await service.validatePhone('50987654', 'TN');
        if (result.details.carrier === 'Orange Tunisie') {
            console.log('✅ PASS');
            passed++;
        } else {
            console.log('❌ FAIL - Carrier:', result.details.carrier);
            failed++;
        }
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        failed++;
    }

    // Test 6: Spam Detection
    console.log('\nTest 6: Spam Detection');
    try {
        const result = await service.detectSpam('FREE MONEY CLICK NOW!!!');
        if (result.isSpam && result.score > 70) {
            console.log('✅ PASS');
            passed++;
        } else {
            console.log('❌ FAIL - Score:', result.score, 'IsSpam:', result.isSpam);
            failed++;
        }
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        failed++;
    }

    // Test 7: Clean Text
    console.log('\nTest 7: Clean Text Detection');
    try {
        const result = await service.detectSpam('Hello, I am interested');
        if (!result.isSpam && result.score < 50) {
            console.log('✅ PASS');
            passed++;
        } else {
            console.log('❌ FAIL - Score:', result.score);
            failed++;
        }
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        failed++;
    }

    // Test 8: Full Validation
    console.log('\nTest 8: Full Validation');
    try {
        const result = await service.validateFull(
            'contact@company.com',
            '20123456',
            'Normal message',
            { country: 'TN' }
        );
        if (result.isValid && result.globalScore > 70) {
            console.log('✅ PASS');
            passed++;
        } else {
            console.log('❌ FAIL - Score:', result.globalScore);
            failed++;
        }
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        failed++;
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
    console.log(`✨ Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);

    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(console.error);
