/**
 * PHASE 3 - TESTS LOCAUX (Sans serveur)
 *
 * Tests directs du UnifiedValidationService
 * Pour tester sans avoir besoin du serveur NestJS
 */

import { UnifiedValidationService } from './src/shared/validation/unified-validation.service';

interface TestResult {
    name: string;
    success: boolean;
    duration: number;
    details?: any;
    error?: string;
}

const results: TestResult[] = [];

// Données de test réelles
const testCases = [
    {
        name: 'Lead professionnel valide',
        email: 'contact@agence-immobiliere-tunis.com',
        phone: '+21620123456',
        text: 'Bonjour, je cherche un appartement S+2 à La Marsa, budget 300K TND',
        expectedSpam: false,
    },
    {
        name: 'Lead avec email gratuit',
        email: 'ahmed.benali@gmail.com',
        phone: '+21698765432',
        text: 'Cherche villa avec piscine à Gammarth',
        expectedSpam: false,
    },
    {
        name: 'Lead avec email jetable (spam)',
        email: 'winner123@tempmail.com',
        phone: '+21650000000',
        text: 'FREE MONEY!!! CLICK NOW!!! Urgent investment opportunity',
        expectedSpam: true,
    },
    {
        name: 'Lead téléphone Orange',
        email: 'client@example.com',
        phone: '+21622334455',
        text: 'Intéressé par terrain constructible à Hammamet',
        expectedSpam: false,
    },
    {
        name: 'Lead téléphone Ooredoo',
        email: 'prospect@test.com',
        phone: '+21698112233',
        text: 'Recherche local commercial centre ville Tunis',
        expectedSpam: false,
    },
    {
        name: 'Lead téléphone Tunisie Télécom fixe',
        email: 'info@company.tn',
        phone: '+21671234567',
        text: 'Demande information pour projet immobilier',
        expectedSpam: false,
    },
    {
        name: 'Spam évident - capitales excessives',
        email: 'URGENT@spam.com',
        phone: '+21600000000',
        text: 'URGENT!!! FREE PROPERTY!!! CLICK HERE NOW!!! LIMITED OFFER!!!',
        expectedSpam: true,
    },
    {
        name: 'Lead avec email invalide',
        email: 'invalid-email',
        phone: '+21620998877',
        text: 'Cherche appartement',
        expectedSpam: false,
    },
];

async function runTests() {
    console.log('='.repeat(70));
    console.log('PHASE 3 - TESTS LOCAUX UnifiedValidationService');
    console.log('='.repeat(70));
    console.log(`Date: ${new Date().toISOString()}`);
    console.log(`Tests: ${testCases.length} scénarios`);
    console.log();

    const validationService = new UnifiedValidationService();

    for (const testCase of testCases) {
        console.log(`\n${'='.repeat(70)}`);
        console.log(`Test: ${testCase.name}`);
        console.log('-'.repeat(70));

        const start = Date.now();

        try {
            // Validation complète
            const validation = await validationService.validateFull(
                testCase.email,
                testCase.phone,
                testCase.text,
                { country: 'TN', detectSpam: true, strictMode: true }
            );

            const duration = Date.now() - start;

            // Vérifier résultats
            const spamMatch = validation.spam?.isSpam === testCase.expectedSpam;
            const performanceOk = duration < 100;
            const success = spamMatch && performanceOk;

            results.push({
                name: testCase.name,
                success,
                duration,
                details: {
                    email: {
                        valid: validation.email?.isValid,
                        score: validation.email?.score,
                        disposable: validation.email?.format?.isDisposable,
                        freeProvider: validation.email?.format?.isFreeProvider,
                    },
                    phone: {
                        valid: validation.phone?.isValid,
                        score: validation.phone?.score,
                        carrier: validation.phone?.details?.carrier,
                        type: validation.phone?.details?.type,
                    });

            // Afficher résultats
            console.log(`⏱️  Duration: ${duration}ms ${performanceOk ? '✅' : '⚠️ SLOW'}`);
            console.log();

            // Email
            console.log('📧 EMAIL:');
            console.log(`   Valid: ${validation.email?.isValid ? '✅' : '❌'} (score: ${validation.email?.score})`);
            if (validation.email) {
                console.log(`   Email: ${validation.email.email}`);
                console.log(`   Type: ${validation.email.format?.isFreeProvider ? 'Free' : 'Professional'}`);
            }
            if (validation.email?.format?.isDisposable) {
                console.log(`   💡 Suggestions: ${validation.email.suggestions.join(', ')}`);
            }
            console.log();

            // Phone
            console.log('📱 PHONE:');
            console.log(`   Valid: ${validation.phone?.isValid ? '✅' : '❌'} (score: ${validation.phone?.score})`);
            if (validation.phone?.normalized) {
                console.log(`   Format: ${validation.phone.normalized.international}`);
            }
            if (validation.phone?.details?.carrier) {
                console.log(`   Carrier: ${validation.phone.details.carrier} (${validation.phone.details.type})`);
                // Spam
                console.log('🚫 SPAM:');
                const spamIcon = validation.spam?.isSpam ? '🚫 SPAM' : '✅ Clean';
                console.log(`   ${spamIcon} (score: ${validation.spam?.score})`);
                if (validation.spam?.categories) {
                    const cats = Object.entries(validation.spam.categories)
                        .filter(([_, score]) => score > 0)
                        .map(([cat, score]) => `${cat}:${score}`)
                        .join(', ');
          .filter(([_, value]) => value === true)
                        .map(([cat, _]) => cat)
                        .join(', ');
                    if (cats) {
                        console.log(`   Categories: ${cats}`);
                    }
                }
                if (validation.spam?.reasons?.length) {
                    console.log(`   Reasons: ${validation.spam.reasons.slice(0, 3).join('; ')}`);
                } else {
                    console.log(`\n❌ TEST FAILED`);
                    if (!spamMatch) {
                        console.log(`   Expected spam: ${testCase.expectedSpam}, Got: ${validation.spam?.isSpam}`);
                    }
                    if (!performanceOk) {
                        console.log(`   Performance too slow: ${duration}ms (expected <100ms)`);
                    }
                }

            } catch (error: any) {
                const duration = Date.now() - start;
                results.push({
                    name: testCase.name,
                    success: false,
                    duration,
                    error: error.message,
                });

                console.log(`❌ ERROR: ${error.message}`);
                console.log(`   Duration: ${duration}ms`);
            }
        }

    // Résumé final
    printSummary();
    }

    function printSummary() {
        console.log('\n\n' + '='.repeat(70));
        console.log('📊 RAPPORT FINAL - PHASE 3');
        console.log('='.repeat(70));

        const totalTests = results.length;
        const successTests = results.filter(r => r.success).length;
        const failedTests = results.filter(r => !r.success);
        const successRate = (successTests / totalTests) * 100;

        console.log(`\nTests réussis: ${successTests}/${totalTests} (${successRate.toFixed(1)}%)`);

        // Performance
        const durations = results.map(r => r.duration);
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        const maxDuration = Math.max(...durations);
        const minDuration = Math.min(...durations);
        const under100ms = durations.filter(d => d < 100).length;

        console.log('\n⚡ PERFORMANCE:');
        console.log(`   Moyenne: ${avgDuration.toFixed(2)}ms`);
        console.log(`   Min: ${minDuration}ms`);
        console.log(`   Max: ${maxDuration}ms`);
        console.log(`   < 100ms: ${under100ms}/${totalTests} (${((under100ms / totalTests) * 100).toFixed(1)}%)`);

        // Métriques validation
        const emailResults = results.map(r => r.details?.email).filter(Boolean);
        const phoneResults = results.map(r => r.details?.phone).filter(Boolean);
        const spamResults = results.map(r => r.details?.spam).filter(Boolean);

        const validEmails = emailResults.filter(e => e.valid).length;
        const validPhones = phoneResults.filter(p => p.valid).length;
        const detectedSpam = spamResults.filter(s => s.isSpam).length;

        console.log('\n📊 QUALITÉ:');
        console.log(`   Emails valides: ${validEmails}/${emailResults.length} (${((validEmails / emailResults.length) * 100).toFixed(1)}%)`);
        console.log(`   Téléphones valides: ${validPhones}/${phoneResults.length} (${((validPhones / phoneResults.length) * 100).toFixed(1)}%)`);
        console.log(`   Spam détecté: ${detectedSpam}/${spamResults.length} (${((detectedSpam / spamResults.length) * 100).toFixed(1)}%)`);

        // Carriers
        const carriers = phoneResults
            .map(p => p.carrier)
            .filter(Boolean)
            .reduce((acc, carrier) => {
                acc[carrier] = (acc[carrier] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

        if (Object.keys(carriers).length > 0) {
            console.log('\n📱 OPÉRATEURS DÉTECTÉS:');
            Object.entries(carriers).forEach(([carrier, count]) => {
                console.log(`   ${carrier}: ${count}`);
            });
        }

        // Tests échoués
        if (failedTests.length > 0) {
            console.log('\n❌ TESTS ÉCHOUÉS:');
            failedTests.forEach(test => {
                console.log(`   - ${test.name}`);
                if (test.error) {
                    console.log(`     Erreur: ${test.error}`);
                }
            });
        }

        console.log('\n' + '='.repeat(70));

        if (successRate === 100) {
            console.log('🎉 TOUS LES TESTS RÉUSSIS! Phase 3 validée.');
        } else if (successRate >= 80) {
            console.log('✅ Phase 3 partiellement validée.');
        } else {
            console.log('❌ Phase 3 nécessite des corrections.');
        }

        // Objectifs
        console.log('\n🎯 OBJECTIFS PHASE 3:');
        const perfOk = (under100ms / totalTests) >= 0.95;
        const spamOk = detectedSpam >= 2; // Au moins 2 spams détectés sur nos tests
        const emailOk = (validEmails / emailResults.length) >= 0.75;
        const phoneOk = (validPhones / phoneResults.length) >= 0.90;

        console.log(`   ${perfOk ? '✅' : '❌'} Performance <100ms: ${((under100ms / totalTests) * 100).toFixed(1)}% (objectif: 95%)`);
        console.log(`   ${spamOk ? '✅' : '❌'} Détection spam: Fonctionnelle`);
        console.log(`   ${emailOk ? '✅' : '❌'} Emails valides: ${((validEmails / emailResults.length) * 100).toFixed(1)}% (objectif: 75%+)`);
        console.log(`   ${phoneOk ? '✅' : '❌'} Téléphones valides: ${((validPhones / phoneResults.length) * 100).toFixed(1)}% (objectif: 90%+)`);

        console.log('\n' + '='.repeat(70));
    }

    // Exécution
    runTests().catch(console.error);
