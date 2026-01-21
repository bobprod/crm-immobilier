/**
 * PHASE 3 - TESTS D'INTEGRATION STAGING
 *
 * Tests avec données réelles pour valider:
 * 1. UnifiedValidationService intégration
 * 2. Performance (<100ms)
 * 3. Détection spam avec vraies données
 * 4. Scoring qualité emails/téléphones
 */

import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';
const TEST_USER_ID = 'test-user-phase3';

interface TestResult {
    name: string;
    success: boolean;
    duration: number;
    details?: any;
    error?: string;
}

const results: TestResult[] = [];

// Données de test réelles (exemples typiques du marché immobilier tunisien)
const testLeads = [
    {
        name: 'Lead professionnel valide',
        email: 'contact@agence-immobiliere-tunis.com',
        phone: '+21620123456',
        text: 'Bonjour, je cherche un appartement S+2 à La Marsa, budget 300K TND',
        expectedSpam: false,
        expectedEmailQuality: 'high',
    },
    {
        name: 'Lead avec email gratuit',
        email: 'ahmed.benali@gmail.com',
        phone: '+21698765432',
        text: 'Cherche villa avec piscine à Gammarth',
        expectedSpam: false,
        expectedEmailQuality: 'medium',
    },
    {
        name: 'Lead avec email jetable (spam)',
        email: 'winner123@tempmail.com',
        phone: '+21650000000',
        text: 'FREE MONEY!!! CLICK NOW!!! Urgent investment opportunity',
        expectedSpam: true,
        expectedEmailQuality: 'low',
    },
    {
        name: 'Lead téléphone Orange',
        email: 'client@example.com',
        phone: '+21622334455',
        text: 'Intéressé par terrain constructible à Hammamet',
        expectedSpam: false,
        expectedCarrier: 'Orange',
    },
    {
        name: 'Lead téléphone Ooredoo',
        email: 'prospect@test.com',
        phone: '+21698112233',
        text: 'Recherche local commercial centre ville Tunis',
        expectedSpam: false,
        expectedCarrier: 'Ooredoo',
    },
    {
        name: 'Lead téléphone Tunisie Télécom fixe',
        email: 'info@company.tn',
        phone: '+21671234567',
        text: 'Demande information pour projet immobilier',
        expectedSpam: false,
        expectedCarrier: 'Tunisie Télécom',
    },
    {
        name: 'Spam évident - capitales excessives',
        email: 'URGENT@spam.com',
        phone: '+21600000000',
        text: 'URGENT!!! FREE PROPERTY!!! CLICK HERE NOW!!! LIMITED OFFER!!!',
        expectedSpam: true,
        expectedEmailQuality: 'low',
    },
    {
        name: 'Lead avec email invalide',
        email: 'invalid-email',
        phone: '+21620998877',
        text: 'Cherche appartement',
        expectedSpam: false,
        expectedEmailQuality: 'invalid',
    },
];

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testValidationEndpoint() {
    console.log('\n📝 Test 1: Endpoint validation direct');
    console.log('='.repeat(70));

    for (const lead of testLeads) {
        const start = Date.now();

        try {
            // Note: Cet endpoint devra être créé pour exposer la validation
            const response = await axios.post(`${API_BASE}/validation/full`, {
                email: lead.email,
                phone: lead.phone,
                text: lead.text,
                options: { country: 'TN', detectSpam: true, strictMode: true }
            }, {
                timeout: 5000,
                validateStatus: () => true // Accept all status codes
            });

            const duration = Date.now() - start;

            const validation = response.data;
            const success =
                (lead.expectedSpam === validation.spam?.isSpam) &&
                (duration < 100);

            results.push({
                name: `Validation: ${lead.name}`,
                success,
                duration,
                details: {
                    emailScore: validation.email?.score,
                    phoneScore: validation.phone?.score,
                    spamScore: validation.spam?.score,
                    isSpam: validation.spam?.isSpam,
                    carrier: validation.phone?.carrier?.name,
                }
            });

            console.log(`${success ? '✅' : '❌'} ${lead.name}`);
            console.log(`   Duration: ${duration}ms ${duration < 100 ? '✅' : '⚠️ SLOW'}`);
            console.log(`   Email: ${validation.email?.isValid ? '✅' : '❌'} (score: ${validation.email?.score})`);
            console.log(`   Phone: ${validation.phone?.isValid ? '✅' : '❌'} (score: ${validation.phone?.score})`);
            console.log(`   Spam: ${validation.spam?.isSpam ? '🚫' : '✅'} (score: ${validation.spam?.score})`);
            if (validation.phone?.carrier) {
                console.log(`   Carrier: ${validation.phone.carrier.name}`);
            }

        } catch (error: any) {
            const duration = Date.now() - start;
            results.push({
                name: `Validation: ${lead.name}`,
                success: false,
                duration,
                error: error.message,
            });

            console.log(`❌ ${lead.name}`);
            console.log(`   Error: ${error.message}`);
        }

        console.log();
    }
}

async function testProspectingFlow() {
    console.log('\n🔄 Test 2: Flow complet prospecting avec validation');
    console.log('='.repeat(70));

    // Test de création de campagne avec validation des leads
    const campaignData = {
        name: 'Test Phase 3 - Validation Integration',
        description: 'Campaign pour tester l\'intégration de UnifiedValidationService',
        userId: TEST_USER_ID,
        type: 'targeted',
        status: 'active',
    };

    try {
        const start = Date.now();

        // Créer une campagne
        const campaignResponse = await axios.post(
            `${API_BASE}/prospecting/campaigns`,
            campaignData,
            { timeout: 5000 }
        );

        const campaign = campaignResponse.data;
        const duration = Date.now() - start;

        console.log(`✅ Campaign créée: ${campaign.id}`);
        console.log(`   Duration: ${duration}ms`);

        // Ajouter des leads avec validation
        for (const lead of testLeads.slice(0, 3)) {
            const leadStart = Date.now();

            try {
                const leadResponse = await axios.post(
                    `${API_BASE}/prospecting/campaigns/${campaign.id}/leads`,
                    {
                        email: lead.email,
                        phone: lead.phone,
                        source: 'test-phase3',
                        rawText: lead.text,
                    },
                    { timeout: 5000 }
                );

                const leadDuration = Date.now() - leadStart;
                const createdLead = leadResponse.data;

                console.log(`\n${createdLead.validation?.spam?.isSpam ? '🚫' : '✅'} Lead: ${lead.name}`);
                console.log(`   Duration: ${leadDuration}ms`);
                console.log(`   Score global: ${createdLead.score}`);
                console.log(`   Validation présente: ${createdLead.validation ? '✅' : '❌'}`);

                if (createdLead.validation) {
                    console.log(`   - Email valide: ${createdLead.validation.email?.isValid ? '✅' : '❌'}`);
                    console.log(`   - Phone valide: ${createdLead.validation.phone?.isValid ? '✅' : '❌'}`);
                    console.log(`   - Spam détecté: ${createdLead.validation.spam?.isSpam ? '🚫' : '✅'}`);
                }

                results.push({
                    name: `Prospecting: ${lead.name}`,
                    success: true,
                    duration: leadDuration,
                    details: {
                        leadId: createdLead.id,
                        score: createdLead.score,
                        hasValidation: !!createdLead.validation,
                    }
                });

            } catch (error: any) {
                console.log(`❌ Erreur création lead: ${lead.name}`);
                console.log(`   Error: ${error.message}`);

                results.push({
                    name: `Prospecting: ${lead.name}`,
                    success: false,
                    duration: Date.now() - leadStart,
                    error: error.message,
                });
            }
        }

    } catch (error: any) {
        console.log(`❌ Erreur création campagne: ${error.message}`);
        results.push({
            name: 'Prospecting: Campaign Creation',
            success: false,
            duration: 0,
            error: error.message,
        });
    }
}

async function testPerformanceMetrics() {
    console.log('\n⚡ Test 3: Métriques de performance');
    console.log('='.repeat(70));

    const durations = results.map(r => r.duration).filter(d => d > 0);

    if (durations.length > 0) {
        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
        const max = Math.max(...durations);
        const min = Math.min(...durations);
        const under100ms = durations.filter(d => d < 100).length;
        const percentage = (under100ms / durations.length) * 100;

        console.log(`Moyenne: ${avg.toFixed(2)}ms`);
        console.log(`Min: ${min}ms`);
        console.log(`Max: ${max}ms`);
        console.log(`< 100ms: ${under100ms}/${durations.length} (${percentage.toFixed(1)}%)`);
        console.log();

        if (avg < 100 && percentage >= 95) {
            console.log('✅ Performance objectif atteint! (<100ms, >95%)');
        } else {
            console.log('⚠️ Performance à améliorer');
        }
    }
}

function printFinalReport() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 RAPPORT FINAL - PHASE 3 STAGING');
    console.log('='.repeat(70));

    const totalTests = results.length;
    const successTests = results.filter(r => r.success).length;
    const failedTests = results.filter(r => !r.success);
    const successRate = (successTests / totalTests) * 100;

    console.log(`\nTests réussis: ${successTests}/${totalTests} (${successRate.toFixed(1)}%)`);

    if (failedTests.length > 0) {
        console.log('\n❌ Tests échoués:');
        failedTests.forEach(test => {
            console.log(`   - ${test.name}`);
            if (test.error) {
                console.log(`     Erreur: ${test.error}`);
            }
        });
    }

    console.log('\n' + '='.repeat(70));

    if (successRate === 100) {
        console.log('🎉 TOUS LES TESTS REUSSIS! Phase 3 validée.');
    } else if (successRate >= 80) {
        console.log('✅ Phase 3 partiellement validée. Quelques corrections nécessaires.');
    } else {
        console.log('❌ Phase 3 nécessite des corrections importantes.');
    }

    console.log('='.repeat(70));
}

async function runPhase3Tests() {
    console.log('🚀 DEMARRAGE TESTS PHASE 3 - STAGING');
    console.log('='.repeat(70));
    console.log('API Base:', API_BASE);
    console.log('Date:', new Date().toISOString());
    console.log();

    try {
        // Vérifier que le serveur est accessible
        console.log('Vérification connexion serveur...');
        await axios.get(`${API_BASE}/health`, { timeout: 5000 });
        console.log('✅ Serveur accessible\n');
    } catch (error: any) {
        console.log('❌ Serveur non accessible!');
        console.log('   Assurez-vous que le backend est démarré (npm run start:dev)');
        console.log(`   Error: ${error.message}\n`);

        // Continue quand même pour tester ce qui est possible
    }

    await testValidationEndpoint();
    await testProspectingFlow();
    await testPerformanceMetrics();

    printFinalReport();
}

// Exécution
runPhase3Tests().catch(console.error);
