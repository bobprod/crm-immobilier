import { IsString, IsOptional, IsDateString } from 'class-validator';

export class GenerateReportDto {
  @IsString()
  reportType: 'daily' | 'weekly' | 'monthly' | 'custom';

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  format?: 'json' | 'pdf' | 'excel';
}

export interface ReportData {
  period: {
    startDate: Date;
    endDate: Date;
    label: string;
  };
  summary: {
    totalProspects: number;
    newProspects: number;
    qualifiedProspects: number;
    totalProperties: number;
    newProperties: number;
    totalAppointments: number;
    completedAppointments: number;
    revenue: number;
  };
  insights: string[];
  recommendations: string[];
  charts?: any[];
}
