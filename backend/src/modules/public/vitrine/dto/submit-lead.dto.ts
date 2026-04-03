import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsIn } from 'class-validator';

export class SubmitLeadDto {
  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiProperty({
    enum: ['CONTACT', 'VISIT_REQUEST', 'ESTIMATION', 'ALERT', 'INVESTMENT'],
    default: 'CONTACT',
  })
  @IsIn(['CONTACT', 'VISIT_REQUEST', 'ESTIMATION', 'ALERT', 'INVESTMENT'])
  @IsOptional()
  type?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  propertyId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  agentProfileId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  utmSource?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  utmMedium?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  utmCampaign?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  referrer?: string;
}
