import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../authz/decorators/current-user.decorator';
import { Public } from '../../authz/decorators/public.decorator';
import { RequirePermissions } from '../../authz/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../authz/permissions';
import type { Actor } from '../../authz/policy';
import { ROLE_VALUES, type Role } from '../../authz/roles';
import { fieldError } from '../../common/http-errors';
import { ListUsersQueryDto } from '../../common/query.dto';
import { UpdateRoleDto } from '../auth/dto/auth.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private readonly users: UsersService) {}

    @Public()
    @Get()
    @ApiOperation({ summary: 'List users' })
    async list(@Query() query: ListUsersQueryDto) {
        const data = await this.users.getUsers({
            nick_name: query.nick_name,
            _id: query._id,
            is_verified: query.is_verified,
        });
        return { status: true, message: 'Users fetched', data };
    }

    @Public()
    @Get(':nick_name')
    async byNick(@Param('nick_name') nickName: string) {
        const data = await this.users.getByNickName(nickName);
        return { status: true, message: 'User fetched', data };
    }

    @ApiBearerAuth()
    @Post(':id/follow')
    async follow(@Param('id') id: string, @CurrentUser() actor: Actor) {
        const data = await this.users.follow(id, actor);
        return { status: true, message: 'Followed', data };
    }

    @ApiBearerAuth()
    @Delete(':id/follow')
    async unfollow(@Param('id') id: string, @CurrentUser() actor: Actor) {
        const data = await this.users.unfollow(id, actor);
        return { status: true, message: 'Unfollowed', data };
    }

    @ApiBearerAuth()
    @RequirePermissions(PERMISSIONS.MANAGE_ROLES)
    @Patch(':id/role')
    async updateRole(
        @Param('id') id: string,
        @Body() dto: UpdateRoleDto,
        @CurrentUser() actor: Actor,
    ) {
        if (!ROLE_VALUES.includes(dto.userRole as Role)) {
            throw fieldError('userRole', 'Invalid role', dto.userRole);
        }
        const data = await this.users.updateRole(
            id,
            dto.userRole as Role,
            actor,
        );
        return { status: true, message: 'Role updated', data };
    }
}
