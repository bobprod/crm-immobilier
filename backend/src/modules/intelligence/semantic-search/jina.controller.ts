import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JinaService } from './jina.service';
import { JinaConfigDto, TestJinaDto, JinaEmbeddingsDto, JinaRerankDto, JinaReadUrlDto } from './dto/jina-config.dto';

@ApiTags('Jina.ai Integration')
@Controller('jina')
export class JinaController {
    constructor(private readonly jinaService: JinaService) { }

    @Post('test')
    @ApiOperation({ summary: 'Tester la configuration Jina.ai' })
    @ApiResponse({ status: 200, description: 'Test réussi' })
    async testConfiguration(
        @Param('userId') userId: string,
        @Body() dto: TestJinaDto,
    ): Promise<{
        success: boolean;
        message: string;
        latency?: number;
    }> {
        return this.jinaService.testConfiguration(userId, dto);
    }

    @Get('info/:userId')
    @ApiOperation({ summary: 'Obtenir les informations du provider Jina' })
    @ApiResponse({ status: 200, description: 'Informations du provider' })
    async getProviderInfo(@Param('userId') userId: string) {
        return this.jinaService.getProviderInfo(userId);
    }

    @Post('embeddings/:userId')
    @ApiOperation({ summary: 'Créer des embeddings avec Jina.ai' })
    @ApiResponse({ status: 200, description: 'Embeddings créés' })
    async createEmbeddings(
        @Param('userId') userId: string,
        @Body() dto: JinaEmbeddingsDto,
    ): Promise<number[]> {
        return this.jinaService.createEmbeddings(userId, dto);
    }

    @Post('rerank/:userId')
    @ApiOperation({ summary: 'Reranker des résultats avec Jina.ai' })
    @ApiResponse({ status: 200, description: 'Résultats rerankés' })
    async rerank(
        @Param('userId') userId: string,
        @Body() dto: JinaRerankDto,
    ): Promise<number[]> {
        return this.jinaService.rerank(userId, dto);
    }

    @Post('read-url/:userId')
    @ApiOperation({ summary: 'Lire le contenu d\'une URL avec Jina.ai' })
    @ApiResponse({ status: 200, description: 'Contenu extrait' })
    async readUrl(
        @Param('userId') userId: string,
        @Body() dto: JinaReadUrlDto,
    ): Promise<string> {
        return this.jinaService.readUrl(userId, dto);
    }
}
