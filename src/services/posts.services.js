const { deleteFile } = require("./aws.services")

const { getUserByQuery, getUsersByQuery } = require('../db/users.db')
const { getPostByQuery, getPostsByQuery, createNewPost, updatePostById, deletePostById } = require('../db/posts')
const { addPostToSaved, removePostFromSaved } = require('../db/profile')
const { addNotificationToUserById } = require('../db/profile.js')
const { addCommentToPost, addReplyToComment, getCommentsByPostId, getCommentsByQuery } = require('../db/postComments')

const { uploadImage } = require('./aws.services')

const { ObjectId } = require('mongodb');
const mongoose = require('mongoose')

const NotFoundError = require('../errors/NotFoundError')
const AppError = require('../errors/AppError');
const UnAuthorizedError = require('../errors/UnAuthorizedError');
const ConflictError = require('../errors/ConflictError');
const BadRequestError = require('../errors/BadRequestError');

function normalizePostIdsFilter(params = {}) {
    const hasIdsQuery = Object.prototype.hasOwnProperty.call(params, 'ids')
        || Object.prototype.hasOwnProperty.call(params, 'id')
        || Object.prototype.hasOwnProperty.call(params, '_id')

    const rawIds = []
    const candidates = [params.ids, params.id, params._id]

    for (const candidate of candidates) {
        if (candidate === undefined || candidate === null) continue

        if (Array.isArray(candidate)) {
            for (const value of candidate) {
                rawIds.push(...String(value).split(','))
            }
            continue
        }

        rawIds.push(...String(candidate).split(','))
    }

    const ids = rawIds
        .map((id) => id.trim())
        .filter(Boolean)

    if (!ids.length) {
        if (hasIdsQuery) {
            return { ...params, __emptyPostsResult: true }
        }

        return params
    }

    const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id))

    if (invalidIds.length) {
        throw new BadRequestError({
            errors: {
                query: {
                    ids: {
                        message: 'Incorrect id format in ids query field!',
                        data: invalidIds
                    }
                }
            }
        })
    }

    const uniqueIds = [...new Set(ids)]

    delete params.ids
    delete params.id
    delete params._id
    params._id = { $in: uniqueIds }

    return params
}

async function createPost({
    title,
    content_text,
    category,
    featured_image,
    profile
}) {
    if(!profile || !title || !content_text || !category) {
        throw new AppError({ message: "Missing required fields!" })
    }
    
    var img_url = null

    if(featured_image) {
        if(featured_image.size !== 0){

            const image_upload_result = await uploadImage(featured_image, "featured_image", Date.now().toString())
            
            if(!image_upload_result.status) {
                throw new AppError({ message: "Error to upload image to storage!" })
            }
            else {
                img_url = image_upload_result.data.url
            }
        }
    }
        
    const post_creating_result = await createNewPost(title, content_text, category, profile._id, img_url)

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

async function editPost(id, data, profile) {
    if(!id || !data || !profile) {
        throw new AppError({ message: "Missing required fields!" })
    }

    const post = await getPostByQuery({ "_id": id })

    if(!post.status) {
        throw new NotFoundError({ message: "Post not found!" })
    }

    if(Object.keys(data).includes("featured_image")) {
        if(post.data.featured_image) {
            await deleteFile(post.data.featured_image)
        }

        if(data.featured_image !== undefined && data.featured_image !== null) { 
            const upload_image_result = await uploadImage(data.featured_image, "featured_image", Date.now().toString())
            data.featured_image = upload_image_result.data.url
        }
        else {
            data.featured_image = null
        }
    }

    const result = await updatePostById(id, data)
    
    global.Logger.log({
        type: "update_post",
        message: `User ${profile.nick_name} updated post ${post._id}`,
        data: {
            user: profile._id,
            post_id: post._id,
            updates: data
        }
    })

    return {
        status: true,
        message: "Success updated post",
        data: result.data
    }
}

async function insertAuthorToPost(post) {
    if(!post) {
        throw new AppError({ message: "Post is required to insert author!" })
    }

    post = post.toObject()
    
    let author = await getUserByQuery({ '_id': post.author })
    if(author.status) post.author = author.data

    return post
}

async function getPosts(params, expand) {
    if(!params) {
        throw new AppError({ message: "Missing required fields!" })
    }

    params = normalizePostIdsFilter(params)

    if (params.__emptyPostsResult) {
        delete params.__emptyPostsResult

        return {
            status: true,
            message: "Success fetched posts",
            data: []
        }
    }

    const posts = await getPostsByQuery(params)

    if(!posts.status) {
        throw new NotFoundError({ message: "Posts not found!" })
    }

    const expand_options = expand ? expand.split(',').map((e) => e.trim()) : []
    
    if(expand_options.includes("author")) {
        for (let i = 0; i < posts.data.length; i++) {
            posts.data[i] = await insertAuthorToPost(posts.data[i])
        }
    }
    
    if(expand_options.includes("comments")) {
        for (let i = 0; i < posts.data.length; i++) {
            const comments = []
            for (const comment of posts.data[i].comments) {
                const author = await getUserByQuery({ '_id': comment.author })
                if(author.status){
                    comment.author = {
                        _id: author.data._id,
                        nick_name: author.data.nick_name,
                        avatar: author.data.avatar
                    }
                }
                comments.push(comment)
            }
            posts.data[i].comments = comments
        }
    }

    return {
        status: true,
        message: "Success fetched posts",
        data: posts.data
    }
}

async function getPostById(id, expand) {
    if(!id) {
        throw new AppError({ message: "Missing required fields!" })
    }

    const post = await getPostByQuery({ "_id": id })

    if(!post.status) {
        throw new NotFoundError({ message: "Post not found!" })
    }

    const expand_options = expand ? expand.split(',').map((e) => e.trim()) : []

    if(expand_options.includes("author")) {
        post.data = await insertAuthorToPost(post.data)
    }

    if(expand_options.includes("comments")) {
        const comments = []
        for (const comment of post.data.comments) {
            const author = await getUserByQuery({ '_id': comment.author })
            if(author.status) comment.author = author.data
            comments.push(comment)
        }
        post.data.comments = comments
    }

    return {
        status: true,
        message: "Success fetched post",
        data: post.data
    }
}

async function deletePost(id, profile) {
    if(!id) {
        throw new AppError({ message: "Missing required fields!" })
    }

    const result = await deletePostById(id)

    if(!result.status) {
        throw new NotFoundError({ message: "Post not found!" })
    }

    let users_with_saved_post = await getUsersByQuery({ saved_posts: new ObjectId(id) })
    if(users_with_saved_post.status) {
        for (const target_user of users_with_saved_post.data) {
            console.log(target_user, id)
            const result = await removePostFromSaved(target_user._id, id)
            console.log(result)
            if(!result.status) {
                global.Logger.log({
                    type: "error",
                    message: "Error to remove post from saved",
                    data: {
                        user_who_deletes_post: profile._id,
                        target_user: target_user._id,
                        post_id: new ObjectId(id)
                    }
                })
            }
        }
    }

    await deleteFile(result.data.featured_image ?? "")

    global.Logger.log({
        type: "delete_post",
        message: `Post has been deleted`,
        data: {
            post_id: new ObjectId(id)
        }
    })

    return {
        status: true,
        message: "Success deleted post",
        data: result.data
    }
}

async function savePost(profile, id) {
    if(!profile || !id) {
        throw new AppError({ message: "Missing required fields!" })
    }

    if(!(await getPostByQuery({ "_id": id })).status) {
        throw new NotFoundError({ message: "Post not found!" })
    }
    
    if(profile.saved_posts.some((p) => String(p) === id )) {
        throw new ConflictError({ message: "Post is already in saved posts!" })
    }

    const result =  await addPostToSaved(profile._id, id) 

    global.Logger.log({
        type: "save_post",
        message: `User ${result.data.nick_name} saved post ${id}`,
        data: {
            user: result.data._id,
            post_id: new mongoose.Types.ObjectId(id)
        }
    })
    
    return {
        status: true,
        message: "Success saved post",
        data: {
            saved_posts: result.data.saved_posts
        }
    }
}

async function unsavePost(profile, id) {
    const user = await getUserByQuery({ "_id": profile._id }, { with_saved_posts: true })

    if(!user.status) {
        throw new UnAuthorizedError()
    }

    if(!(await getPostByQuery({ "_id": id })).status) {
        throw new NotFoundError({ message: "Post not found!" })
    }

    if(!user.data.saved_posts.some((p) => String(p) === id )) {
        throw new ConflictError({ message: "Post is not in saved posts!" })
    }

    const result = await removePostFromSaved(user.data._id, id)

    global.Logger.log({ 
        type: "unsave_post",
        message: `User ${result.data.nick_name} unsaved post ${id}`,
        data: {
            user: result.data._id,
            post_id: new mongoose.Types.ObjectId(id)
        }
    })

    return {
        status: true,
        message: "Success unsaved post",
        data: {
            saved_posts: result.data.saved_posts
        }
    }
}

async function commentPost(post_id, comment_text, parent_comment_id, profile) {
    if(!post_id || !comment_text || !profile) {
        throw new AppError({ message: "Missing required fields!" })
    }
    
    let result

    
    if(parent_comment_id) {
        result = await addReplyToComment(parent_comment_id, comment_text, profile._id)
        
        const comment_author = (await getCommentsByQuery({ _id: parent_comment_id })).data[0].author
        
        if(comment_author.toString() !== profile._id.toString()) {
            const res = await addNotificationToUserById(comment_author, { type: "reply_comment", user: profile._id, comment: result.data._id, post: post_id })
            console.log(res)
        }
    }

    else {
        result = await addCommentToPost(post_id, comment_text, profile._id)
        
        const post_author = (await getPostById(post_id)).data.author
        
        if(post_author.toString() !== profile._id.toString()) {
            await addNotificationToUserById(post_author, { type: "comment_post", user: profile._id, post: post_id })
        }
    }

    if(!result.status) {
        throw new NotFoundError({ message: result.message })
    }


    return {
        status: true,
        message: "Success commented post",
        data: result.data
    }
}

async function getComments(post_id, expand) {
    let post_comments = await getCommentsByPostId(post_id)

    if(!post_comments.status) {
        throw new NotFoundError({ message: post_comments.message })
    }

    let data = []

    for (const comment of post_comments.data) {
        data.push({
            ...comment.toObject(),
            replies: await get_replies(comment._id, expand)
        });
        if(expand === "author") {
            const author = await getUserByQuery({ '_id': comment.author })
            if(author.status) {
                data[data.length - 1].author = {
                    _id: author.data._id,
                    nick_name: author.data.nick_name,
                    avatar: author.data.avatar,
                    is_verified: author.data.is_verified
                }
            }
        }
    }

    return {
        status: true,
        message: "Success fetched comments",
        data: data
    }
}

async function get_replies(comment_id, expand) {
    const comment_replies = await getCommentsByQuery({
        parent_comment_id: comment_id
    });
    
    if(!comment_replies.status) {
        return [];
    }

    const replies = comment_replies.data;

    for (const comment of replies) {
        if(expand === "author") {
            const author = await getUserByQuery({ '_id': comment.author })
            if(author.status) {
                comment.author = {
                    _id: author.data._id,
                    nick_name: author.data.nick_name,
                    avatar: author.data.avatar,
                    is_verified: author.data.is_verified
                }
            }
        }
        comment.replies = await get_replies(comment._id, expand);
    }

    return replies;
}

module.exports = {
    getPosts,
    getPostById,
    createPost,
    editPost,
    deletePost,
    savePost,
    unsavePost,
    commentPost,
    getComments
}