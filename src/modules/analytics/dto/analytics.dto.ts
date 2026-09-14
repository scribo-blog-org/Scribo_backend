import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class TrackVisitDto {
    @ApiProperty()
    @IsString()
    pagePath!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    pageReferrer?: string;
}
