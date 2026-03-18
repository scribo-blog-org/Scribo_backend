const { get_jwt_token } = require('./auth/utils/jwt')
const { get_user_by_query, get_users_by_query } = require('../db/users.db')
const { add_post_to_saved, remove_post_from_saved, read_notifications_by_user_id, update_profile_by_id } = require('../db/profile')
const { get_post_by_query } = require('../db/posts')
const mongoose = require('mongoose');
const { upload_image, delete_file } = require('./aws.services');
const UnAuthorizedError = require('../errors/UnAuthorizedError');

async function getProfile(id) {
    const user = await get_user_by_query({ '_id': id }, { with_saved_posts: true, with_notifications: true })

    if(!user.status) {
        throw new UnAuthorizedError()
    }

    return {
        status: true,
        message: "Success authorized",
        data: user.data
    }
}

async function update_profile(req) {
    const token = req.headers['authorization']?.split(' ')[1]

    const validation = await field_validation([{ type: "token", value: token, source: "Authorization" }]) 

    if(!validation.status) {
        return {
            status: false,
            message: "Unauthorized!",
            data: null,
            errors: validation.errors,
            code: 401
        }
    }

    const user_id = (await get_jwt_token(req.headers['authorization']?.split(' ')[1])).data
    const user = await get_user_by_query({ '_id': user_id })

    if(!user.status) {
        return {
            status: false,
            message: "Unauthorized!",
            data: null,
            code: 401
        }
    }

    const updatable_fields = ['nick_name', 'description', 'is_email_public']
    
    const updates = {}

    for(const field of updatable_fields) {
        if(req.body[field] !== undefined) {
            updates[field] = req.body[field]
        }
    }
    
    const validation_fields = []

    for(const field in updates) {
        validation_fields.push({ type: field, value: updates[field], source: "body" })
    }
    
    const field_validation_result = await field_validation(validation_fields)

    if(!field_validation_result.status) {
        return {
            status: false,
            message: "Some errors in your fields",
            data: null,
            errors: field_validation_result.errors,
            code: 400
        }
    }

    if(updates.is_email_public !== undefined) {
        updates.is_email_public = updates.is_email_public === 'true' || updates.is_email_public === true
    }
    
    if(updates.nick_name) {
        const nick_owner  = await get_users_by_query({ nick_name: updates.nick_name })
        
        if(nick_owner.status && String(nick_owner.data[0]._id) !== String(user.data._id)) {
            return {
                status: false,
                message: "This nick name is already taken!",
                data: null,
                errors: {
                    body: {
                        nick_name: {
                            message: "This nick name is already taken!",
                            data: updates.nick_name
                        }
                    }
                },
                code: 409
            }
        }
    }

    const has_file = req.file && req.file.size && req.file.size > 0
    const has_avatar_in_body = req.body.avatar !== undefined
    
    if(has_file || has_avatar_in_body) {
        if(!has_file && (req.body.avatar === null || req.body.avatar === 'null' || req.body.avatar === '')) {
            if(user.data.avatar) {
                const delete_result = await delete_file(user.data.avatar)

                if(!delete_result) {
                    global.Logger.log({
                        type: "warning",
                        message: `Failed to delete old avatar for user ${user.data._id}`,
                        data: {
                            user_id: user.data._id,
                            old_avatar_url: user.data.avatar
                        }
                    })
                }
            }
            updates.avatar = null
        }
        else if(has_file) {
            if(user.data.avatar) {
                const delete_result = await delete_file(user.data.avatar)
                
                if(!delete_result) {
                    global.Logger.log({
                        type: "warning",
                        message: `Failed to delete old avatar for user ${user.data._id}`,
                        data: {
                            user_id: user.data._id,
                            old_avatar_url: user.data.avatar
                        }
                    })
                }
            }
            const upload_result = await upload_image(req.file, "avatar", user.data._id.toString())
            if(!upload_result.status) {
                return {
                    status: false,
                    message: "Failed to upload avatar",
                    data: null,
                    errors: upload_result.errors,
                    code: 400
                }
            }


            updates.avatar = upload_result.data.url
        }
    }

    for(const field in updates) {
        user.data[field] = updates[field]
    }

    const result = await update_profile_by_id(user.data._id, updates)

    global.Logger.log({
        type: "update_profile",
        message: `User ${user.data.nick_name} updated their profile`,
        data: {
            user: user.data._id,
            updates: updates
        }
    })

    const updated_fields = {}
    for(const field in updates) {
        updated_fields[field] = result.data[field]
    }

    return {
        status: true,
        message: "Success updated profile",
        data: updated_fields,
        code: 200
}}

async function save_post(req) {
    const token = req?.headers?.authorization?.split(' ')?.[1]
    
    fields = [
        {
            type: "token",
            value: token,
            source: "Authorization"
        },
        {
            type: "_id",
            value: req.params.id,
            source: "params"
        }
    ]
    
    const validation = await field_validation(fields)

    if(!validation.status) {
        return {
            status: false, 
            message: "Some errors in your fields",
            data: null,
            errors: validation.errors,
            code: validation.errors.authorization ? 401 : 400
        }
    }

    const user = await get_user_by_query({ "_id": (await get_jwt_token(token)).data }, { with_saved_posts: true })

    if(!user.status) {
        return {
            ...user,
            code: 401
        }
    }

    if(!(await get_post_by_query({ "_id": req.params.id })).status) {
        return {
            status: false,
            message: "Post not found!",
            data: null,
            code: 404
        }
    }

    if(user.data.saved_posts.some((p) => String(p) === req.params.id )) {
        return {
            status: false,
            message: "Post is already in saved posts!",
            data: null,
            code: 409
        }    
    }

    const result =  await add_post_to_saved(user.data._id, req.params.id) 

    global.Logger.log({
        type: "save_post",
        message: `User ${result.data.nick_name} saved post ${req.params.id}`,
        data: {
            user: result.data._id,
            post_id: new mongoose.Types.ObjectId(req.params.id)
        }
    })
    
    return {
        status: true,
        message: "Success saved post",
        data: {
            saved_posts: result.data.saved_posts
        },
        code: 200
    }
}

async function unsave_post(req) {
    const token = req?.headers?.authorization?.split(' ')?.[1]
    fields = [
        {
            type: "token",
            value: token,
            source: "Authorization"
        },
        {
            type: "_id",
            value: req.params.id,
            source: "params"
        }
    ]
    
    const validation = await field_validation(fields)

    if(!validation.status) {
        return {
            status: false, 
            message: "Some errors in your fields",
            data: null,
            errors: validation.errors,
            code: validation.errors.authorization ? 401 : 400
        }
    }

    const user = await get_user_by_query({ "_id": (await get_jwt_token(token)).data }, { with_saved_posts: true })

    if(!user.status) {
        return {
            ...user,
            code: 401
        }
    }

    if(!(await get_post_by_query({ "_id": req.params.id })).status) {
        return {
            status: false,
            message: "Post not found!",
            data: null,
            code: 404
        }
    }

    if(!user.data.saved_posts.some((p) => String(p) === req.params.id )) {
        return {
            status: false,
            message: "Post is not in saved posts!",
            data: null,
            code: 409
        }
    }

    const result = await remove_post_from_saved(user.data._id, req.params.id)

    global.Logger.log({ 
        type: "unsave_post",
        message: `User ${result.data.nick_name} unsaved post ${req.params.id}`,
        data: {
            user: result.data._id,
            post_id: new mongoose.Types.ObjectId(req.params.id)
        }
    })

    return {
        status: true,
        message: "Success unsaved post",
        data: {
            saved_posts: result.data.saved_posts
        },
        code: 200
    }
}

async function read_notifications(req) {
    const validation = await field_validation([{ type: "token", value: req.headers['authorization']?.split(' ')[1], source: "Authorization" }]) 
    
    if(!validation.status) {
        return {
            status: false,
            message: "Some errors in your fields",
            data: null,
            errors: validation.errors,
            code: 401
        }
    }

    const user = await get_user_by_query({ '_id': (await get_jwt_token(req.headers['authorization']?.split(' ')[1])).data }, { with_notifications: true })
    
    if(!user.status) {
        return {
            status: false,
            message: "Unauthorized",
            data: null,
            code: 401
        }
    }

    const result = await read_notifications_by_user_id(user.data._id)

    return {
        status: true,
        message: "Success readed all notifications",
        data: { 
            notifications: result.data.notifications
        },
        code: 200
    }
}     

async function getAuthProfile(token) {
    const user_id = get_jwt_token(token).data
    const user = await get_user_by_query({ '_id': user_id })

    if(!user.status) {
        throw new UnAuthorizedError()
    }

    return {
        status: true,
        message: "Success authorized",
        data: user.data
    }
}

module.exports = {
    getProfile,
    update_profile,
    save_post, 
    unsave_post,
    read_notifications,
    getAuthProfile
}