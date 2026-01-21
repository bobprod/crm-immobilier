/**
 * PHASE 3 - TESTS SIMPLIFIES
 */

import { UnifiedValidationService } from './src/shared/validation/unified-validation.service';

async function runTests() {
    console.log('======================================================================');
    console.log('PHASE 3 - TESTS UnifiedValidationService');
    console.log('======================================================================\n');

    const service = new UnifiedValidationService();
    let passedTests = 0;
    let totalTests = 0;
    const durations: number[] = [];

    // Test 1: Email professionnel
    console.log('Test 1: Email professionnel valide');
    console.log('----------------------------------------------------------------------');
    totalTests++;
    try {
        const start = Date.now();
        const result = await service.validateEmail('contact@agence-immobiliere.tn', {});
        const duration = Date.now() - start;
        durations.push(duration);

        console.log(`✅ Valid: ${result.isValid}, Score: ${result.score}, Duration: ${duration}ms`);
        console.log(`   Type: ${result.format?.isFreeProvider ? 'Free' : 'Professional'}`);
        if (result.isValid && duration < 100) passedTests++;
    } catch (error: any) {
        console.log(`❌ Error: ${error.message}`);
    }
    console.log();

    // Test 2: Email Gmail
    console.log('Test 2: Email Gmail (gratuit)');
    console.log('----------------------------------------------------------------------');
    totalTests++;
    try {
        const start = Date.now();
        const result = await service.validateEmail('ahmed.benali@gmail.com', {});
        const duration = Date.now() - start;
        durations.push(duration);

        console.log(`✅ Valid: ${result.isValid}, Score: ${result.score}, Duration: ${duration}ms`);
        console.log(`   Type: ${result.format?.isFreeProvider ? 'Free' : 'Professional'}`);
        if (result.isValid && duration < 100) passedTests++;
    } catch (error: any) {
        console.log(`❌ Error: ${error.message}`);
    }
    console.log();

    // Test 3: Email jetable (spam)
    console.log('Test 3: Email jetable (spam)');
    console.log('----------------------------------------------------------------------');
    totalTests++;
    try {
        const start = Date.now();
        const result = await service.validateEmail('test@tempmail.com', {});
        const duration = Date.now() - start;
        durations.push(duration);

        console.log(`⚠️  Valid: ${result.isValid}, Score: ${result.score}, Duration: ${duration}ms`);
        console.log(`   Disposable: ${result.format?.isDisposable}`);
        if (result.format?.isDisposable && duration < 100) passedTests++;
    } catch (error: any) {
        console.log(`❌ Error: ${error.message}`);
    }
    console.log();

    // Test 4: Téléphone Orange
    console.log('Test 4: Téléphone Orange Tunisie');
    console.log('----------------------------------------------------------------------');
    totalTests++;
    try {
        const start = Date.now();
        const result = await service.validatePhone('+21622334455', 'TN', {});
        const duration = Date.now() - start;
        durations.push(duration);

        console.log(`✅ Valid: ${result.isValid}, Score: ${result.score}, Duration: ${duration}ms`);
        console.log(`   Carrier: ${result.details?.carrier}, Type: ${result.details?.type}`);
        console.log(`   Format: ${result.normalized?.international}`);
        if (result.isValid && duration < 100) passedTests++;
    } catch (error: any) {
        console.log(`❌ Error: ${error.message}`);
    }
    console.log();

    // Test 5: Téléphone Ooredoo
    console.log('Test 5: Téléphone Ooredoo Tunisie');
    console.log('----------------------------------------------------------------------');
    totalTests++;
    try {
        const start = Date.now();
        const result = await service.validatePhone('+21698112233', 'TN', {});
        const duration = Date.now() - start;
        durations.push(duration);

        console.log(`✅ Valid: ${result.isValid}, Score: ${result.score}, Duration: ${duration}ms`);
        console.log(`   Carrier: ${result.details?.carrier}, Type: ${result.details?.type}`);
        if (result.isValid && duration < 100) passedTests++;
    } catch (error: any) {
        console.log(`❌ Error: ${error.message}`);
    }
    console.log();

    // Test 6: Téléphone fixe TT
    console.log('Test 6: Téléphone fixe Tunisie Télécom');
    console.log('----------------------------------------------------------------------');
    totalTests++;
    try {
        const start = Date.now();
        const result = await service.validatePhone('+21671234567', 'TN', {});
        const duration = Date.now() - start;
        durations.push(duration);

        console.log(`✅ Valid: ${result.isValid}, Score: ${result.score}, Duration: ${duration}ms`);
        console.log(`   Carrier: ${result.details?.carrier}, Type: ${result.details?.type}`);
        if (result.isValid && duration < 100) passedTests++;
    } catch (error: any) {
        console.log(`❌ Error: ${error.message}`);
    }
    console.log();

    // Test 7: Détection spam
    console.log('Test 7: Détection spam (texte suspect)');
    console.log('----------------------------------------------------------------------');
    totalTests++;
    try {
        const start = Date.now();
        const result = await service.detectSpam('FREE MONEY!!! CLICK NOW!!! LIMITED OFFER!!!', {});
        const duration = Date.now() - start;
        durations.push(duration);

        console.log(`🚫 Spam: ${result.isSpam}, Score: ${result.score}, Duration: ${duration}ms`);
        console.log(`   Reasons: ${result.reasons?.slice(0, 3).join('; ')}`);
        if (result.isSpam && duration < 100) passedTests++;
    } catch (error: any) {
        console.log(`❌ Error: ${error.message}`);
    }
    console.log();

    // Test 8: Texte propre
    console.log('Test 8: Texte propre (non-spam)');
    console.log('----------------------------------------------------------------------');
    totalTests++;
    try {
        const start = Date.now();
        const result = await service.detectSpam('Bonjour, je cherche un appartement S+2 à La Marsa', {});
        const duration = Date.now() - start;
        durations.push(duration);

        console.log(`✅ Clean: ${!result.isSpam}, Score: ${result.score}, Duration: ${duration}ms`);
        if (!result.isSpam && duration < 100) passedTests++;
    } catch (error: any) {
        console.log(`❌ Error: ${error.message}`);
    }
    console.log();

    // Test 9: Validation complète
    console.log('Test 9: Validation complète');
    console.log('----------------------------------------------------------------------');
    totalTests++;
    try {
        const start = Date.now();
        const result = await service.validateFull(
            'contact@example.com',
            '+21620123456',
            'Cherche appartement 3 pièces',
            { country: 'TN', detectSpam: true }
        );
        const duration = Date.now() - start;
        durations.push(duration);

        console.log(`✅ Email: ${result.email?.isValid}, Phone: ${result.phone?.isValid}, Spam: ${result.spam?.isSpam}`);
        console.log(`   Global Score: ${result.globalScore}/100, Duration: ${duration}ms`);
        if (result.globalScore && result.globalScore > 50 && duration < 150) passedTests++;
    } catch (error: any) {
        console.log(`❌ Error: ${error.message}`);
    }
    console.log();

    // Résumé
    console.log('======================================================================');
    console.log('RAPPORT FINAL');
    console.log('======================================================================');
    const successRate = (passedTests / totalTests) * 100;
    console.log(`Tests réussis: ${passedTests}/${totalTests} (${successRate.toFixed(1)}%)`);

    if (durations.length > 0) {
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        const maxDuration = Math.max(...durations);
        const minDuration = Math.min(...durations);
        const under100 = durations.filter(d => d < 100).length;

        console.log('\nPerformance:');
        console.log(`  Moyenne: ${avgDuration.toFixed(2)}ms`);
        console.log(`  Min: ${minDuration}ms`);
        console.log(`  Max: ${maxDuration}ms`);
        console.log(`  < 100ms: ${under100}/${durations.length} (${((under100 / durations.length) * 100).toFixed(1)}%)`);
    }

    console.log('\nObjectifs Phase 3:');
    const perfOk = durations.filter(d => d < 100).length / durations.length >= 0.95;
    console.log(`  ${perfOk ? '✅' : '❌'} Performance <100ms: ${((durations.filter(d => d < 100).length / durations.length) * 100).toFixed(1)}% (objectif: 95%)`);
    console.log(`  ${successRate >= 80 ? '✅' : '❌'} Taux de succès: ${successRate.toFixed(1)}% (objectif: 80%+)`);

    console.log('\n======================================================================');
    if (successRate === 100) {
        console.log('🎉 TOUS LES TESTS RÉUSSIS!');
    } else if (successRate >= 80) {
        console.log('✅ Phase 3 validée (partiellement)');
    } else {
        console.log('❌ Corrections nécessaires');
    }
    console.log('======================================================================');
}

runTests().catch(console.error);
