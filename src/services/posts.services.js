const { get_jwt_token } = require('./auth/utils/jwt')
const { get_user_by_query, get_users_by_query, remove_post_from_saved } = require('../db/users.db')
const { upload_image, delete_file } = require("./aws.services")
const { get_posts_by_query, get_post_by_query, create_new_post, delete_post_by_id } = require('../db/posts')
const { get_profile } = require('./profile.services')
const { ObjectId } = require('mongodb');
const NotFoundError = require('../errors/NotFoundError')
const ForbiddenError = require('../errors/ForbiddenError')
const AppError = require('../errors/AppError')

async function createPost({
    title,
    content_text,
    category,
    featured_image,
    profile
}) {
    if(!profile || !title || !content_text || !category) {
        throw new AppError("Missing required fields!")
    }
    
    var img_url = null

    if(featured_image) {
        if(featured_image.size !== 0){

            const image_upload_result = await upload_image(featured_image, "featured_image", Date.now().toString())
            
            if(!image_upload_result.status) {
                throw new AppError("Error to upload image to storage!")
            }
            else {
                img_url = image_upload_result.data.url
            }
        }
    }
        
    const post_creating_result = await create_new_post(title, content_text, category, profile._id, img_url)

    global.Logger.log({
        type: "create_post",
        message: `User ${profile.nick_name} created post`,
        data: {
            user: profile._id,
            post: post_creating_result.data._id
        }
    })

    return {
        status: true,
        message: "Success created post",
        data: post_creating_result.data
    }
}

async function _insert_author_to_post(post) {
    post = post.toObject()
    
    let author = await get_user_by_query({ '_id': post.author })
    if(author.status) post.author = author.data

    return post
}

async function getPosts(params, expand) {
    const posts = await get_posts_by_query(params)

    if(!posts.status) {
        throw new NotFoundError("Posts not found!")
    }

    if(expand === "author") {
        for (let i = 0; i < posts.data.length; i++) {
            posts.data[i] = await _insert_author_to_post(posts.data[i])
        }
    }
    
    return {
        status: true,
        message: "Success fetched posts",
        data: posts.data
    }
}

async function getPostById(id, expand) {
    
    const post = await get_post_by_query({ "_id": id })

    if(!post.status) {
        throw new NotFoundError("Post not found!")
    }

    if(expand === "author") {
        post.data = await _insert_author_to_post(post.data)
    }
    
    return {
        status: true,
        message: "Success fetched post",
        data: post.data
    }
}

async function deletePost(req) {
    fields = [{
            type: "token",
            value:  req?.headers?.authorization?.split(' ')[1],
            source:  "Authorization"
        },
        {
            type: "_id",
            value:  req?.params?.id,
            source:  "params"
        }
    ]

    const validation = await field_validation(fields)
    
    if(!validation.status) {
        return {
            status: false,
            message: "Some errors in your fields",
            errors: validation.errors,
            code: validation.errors.Authorization ? 403 : 400
        }
    }

    const token_result = await get_jwt_token((req.headers['authorization'])?.split(' ')[1])

    const user = await get_user_by_query({ "_id": token_result.data })

    if(!user.status) {
        return {
            status: false,
            message: "Unauthorized!",
            data: null,
            code: 401
        }
    }

    if(!user.data.is_admin) {
        return {
            status: false,
            message: "This user doesn`t has permission to delete posts!",
            data: null,
            code: 403
        }
    }

    const result = await delete_post_by_id(req.params.id)

    if(!result.status) {
        return {
            ...result,
            code: 404
        }
    }

    let users_with_saved_post = await get_users_by_query({ saved_posts: new ObjectId(req.params.id) }) 

    if(users_with_saved_post.status) {
        for (const target_user of users_with_saved_post.data) {
            const result = await remove_post_from_saved(target_user._id, req.params.id)
            if(!result.status) {
                global.Logger.log({
                    type: "error",
                    message: "Error to remove post from saved",
                    data: {
                        user_who_deletes_post: user.data._id,
                        target_user: target_user._id,
                        post_id: new ObjectId(req.params.id)
                    }
                })
            }
        }
    }

    await delete_file(result.data.featured_image ?? "")

    global.Logger.log({
        type: "delete_post",
        message: `User ${user.data.nick_name} deleted post`,
        data: {
            user: user.data._id,
            post_id: new ObjectId(req.params.id)
        }
    })

    return {
        ...result,
        code: 200
    }
}

module.exports = {
    getPosts,
    getPostById,
    createPost,
    delete_post
}