import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class TrackVisitDto {
    @ApiProperty()
    @IsString()
    pagePath!: string;

    @ApiProperty()
    @IsString()
    visitorId!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    pageReferrer?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    city?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    region?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    country?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    ip?: string;
}
