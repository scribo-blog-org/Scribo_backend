import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginationQueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit?: number;
}

export class ListPostsQueryDto extends PaginationQueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    author?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    category?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    expand?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    created_date?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    ids?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    _id?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    id?: string;
}

export class ListUsersQueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    nick_name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    id?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    is_verified?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    is_admin?: string;
}

export class ListLogsQueryDto extends PaginationQueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    user?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    post?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    category?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    support_request?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    type?: string;
}

export class DashboardQueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @IsIn(['7', '14', '30'])
    days?: string;
}

export class ListSupportQueryDto extends PaginationQueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    status?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    kind?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    sort?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    order?: string;
}
