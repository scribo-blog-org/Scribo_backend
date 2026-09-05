import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../authz/decorators/current-user.decorator';
import { Public } from '../../authz/decorators/public.decorator';
import { RequirePermissions } from '../../authz/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../authz/permissions';
import type { Actor } from '../../authz/policy';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, EditCategoryDto } from './dto/categories.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
    constructor(private readonly categories: CategoriesService) {}

    @Public()
    @Get()
    async list() {
        const data = await this.categories.list();
        return {
            status: true,
            message: 'Categories fetched successfully',
            data,
        };
    }

    @ApiBearerAuth()
    @RequirePermissions(PERMISSIONS.CREATE_CATEGORY)
    @Post()
    async create(@Body() dto: CreateCategoryDto, @CurrentUser() actor: Actor) {
        const data = await this.categories.create(dto, actor);
        return { status: true, message: 'Category created', data };
    }

    @ApiBearerAuth()
    @RequirePermissions(PERMISSIONS.EDIT_ANY_CATEGORY)
    @Patch(':id')
    async edit(
        @Param('id') id: string,
        @Body() dto: EditCategoryDto,
        @CurrentUser() actor: Actor,
    ) {
        const data = await this.categories.edit(id, dto, actor);
        return { status: true, message: 'Category updated', data };
    }

    @ApiBearerAuth()
    @RequirePermissions(PERMISSIONS.DELETE_ANY_CATEGORY)
    @Delete(':id')
    async remove(@Param('id') id: string, @CurrentUser() actor: Actor) {
        const data = await this.categories.remove(id, actor);
        return { status: true, message: 'Category deleted', data };
    }
}
