import { Controller, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SettingsService } from './settings.service';

/**
 * Public endpoint controller for testing API keys
 * No authentication required
 */
@ApiTags('API Keys Validation')
@Controller('api-keys')
export class ApiKeysController {
    constructor(private settingsService: SettingsService) { }

    @Post('test/:provider')
    @ApiOperation({ summary: 'Tester une clé API pour un modèle LLM spécifique (Public)' })
    @ApiResponse({
        status: 200,
        schema: {
            example: {
                success: true,
                message: 'Clé valide',
                provider: 'gemini',
                keyPreview: 'AIzaSyB6...',
            },
        },
    })
    testApiKey(@Param('provider') provider: string, @Body() data: { apiKey: string }) {
        return this.settingsService.testApiKey(provider, data.apiKey);
    }
}
