import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEngineConfigDto {
  @ApiPropertyOptional({
    description: 'Activer/désactiver Cheerio',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  cheerioEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Activer/désactiver Puppeteer',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  puppeteerEnabled?: boolean;
}

export class EngineConfigResponseDto {
  cheerioEnabled: boolean;
  puppeteerEnabled: boolean;
}
