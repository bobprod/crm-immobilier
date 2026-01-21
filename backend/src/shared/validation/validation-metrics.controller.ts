import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

interface ValidationMetrics {
    totalValidations: number;
    spamDetected: number;
    spamRate: number;
    validEmails: number;
    invalidEmails: number;
    emailValidityRate: number;
    validPhones: number;
    invalidPhones: number;
    phoneValidityRate: number;
    avgEmailScore: number;
    avgPhoneScore: number;
    avgSpamScore: number;
    carrierBreakdown: { [key: string]: number };
    performanceStats: {
        avgDuration: number;
        under100ms: number;
        under100msRate: number;
    };
}

@Controller('api/validation/metrics')
export class ValidationMetricsController {
    constructor(private prisma: PrismaService) { }

    @Get()
    async getMetrics(
        @Query('days') days: string = '7',
    ): Promise<ValidationMetrics> {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days));

        // Récupérer les leads avec validation depuis X jours
        const leads = await this.prisma.prospecting_leads.findMany({
            where: {
                createdAt: {
                    gte: daysAgo,
                },
                validation: {
                    not: null,
                },
            },
            select: {
                validation: true,
                createdAt: true,
            },
        });

        if (leads.length === 0) {
            return this.getEmptyMetrics();
        }

        // Analyser les validations
        let spamCount = 0;
        let validEmailCount = 0;
        let invalidEmailCount = 0;
        let validPhoneCount = 0;
        let invalidPhoneCount = 0;
        let totalEmailScore = 0;
        let totalPhoneScore = 0;
        let totalSpamScore = 0;
        let emailScoreCount = 0;
        let phoneScoreCount = 0;
        let spamScoreCount = 0;
        const carrierBreakdown: { [key: string]: number } = {};

        for (const lead of leads) {
            const validation = lead.validation as any;

            // Spam
            if (validation?.spam?.isSpam) {
                spamCount++;
            }
            if (validation?.spam?.score !== undefined) {
                totalSpamScore += validation.spam.score;
                spamScoreCount++;
            }

            // Email
            if (validation?.email?.isValid === true) {
                validEmailCount++;
            } else if (validation?.email?.isValid === false) {
                invalidEmailCount++;
            }
            if (validation?.email?.score !== undefined) {
                totalEmailScore += validation.email.score;
                emailScoreCount++;
            }

            // Phone
            if (validation?.phone?.isValid === true) {
                validPhoneCount++;
            } else if (validation?.phone?.isValid === false) {
                invalidPhoneCount++;
            }
            if (validation?.phone?.score !== undefined) {
                totalPhoneScore += validation.phone.score;
                phoneScoreCount++;
            }

            // Carrier
            if (validation?.phone?.carrier?.name) {
                const carrier = validation.phone.carrier.name;
                carrierBreakdown[carrier] = (carrierBreakdown[carrier] || 0) + 1;
            }
        }

        const totalEmails = validEmailCount + invalidEmailCount;
        const totalPhones = validPhoneCount + invalidPhoneCount;

        return {
            totalValidations: leads.length,
            spamDetected: spamCount,
            spamRate: (spamCount / leads.length) * 100,
            validEmails: validEmailCount,
            invalidEmails: invalidEmailCount,
            emailValidityRate: totalEmails > 0 ? (validEmailCount / totalEmails) * 100 : 0,
            validPhones: validPhoneCount,
            invalidPhones: invalidPhoneCount,
            phoneValidityRate: totalPhones > 0 ? (validPhoneCount / totalPhones) * 100 : 0,
            avgEmailScore: emailScoreCount > 0 ? totalEmailScore / emailScoreCount : 0,
            avgPhoneScore: phoneScoreCount > 0 ? totalPhoneScore / phoneScoreCount : 0,
            avgSpamScore: spamScoreCount > 0 ? totalSpamScore / spamScoreCount : 0,
            carrierBreakdown,
            performanceStats: {
                avgDuration: 0, // À implémenter avec logging
                under100ms: 0,
                under100msRate: 0,
            },
        };
    }

    @Get('dashboard')
    async getDashboard() {
        const [last7Days, last30Days, allTime] = await Promise.all([
            this.getMetrics('7'),
            this.getMetrics('30'),
            this.getMetrics('365'),
        ]);

        return {
            last7Days,
            last30Days,
            allTime,
            generated: new Date().toISOString(),
        };
    }

    private getEmptyMetrics(): ValidationMetrics {
        return {
            totalValidations: 0,
            spamDetected: 0,
            spamRate: 0,
            validEmails: 0,
            invalidEmails: 0,
            emailValidityRate: 0,
            validPhones: 0,
            invalidPhones: 0,
            phoneValidityRate: 0,
            avgEmailScore: 0,
            avgPhoneScore: 0,
            avgSpamScore: 0,
            carrierBreakdown: {},
            performanceStats: {
                avgDuration: 0,
                under100ms: 0,
                under100msRate: 0,
            },
        };
    }
}
