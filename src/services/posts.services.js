const { deleteFile } = require("./aws.services")

const { getUserByQuery, getUsersByQuery } = require('../db/users.db')
const { getPostByQuery, getPostsByQuery, createNewPost, updatePostById, deletePostById, doLikeToPost, doUnlikePost } = require('../db/posts')
const { getCategories } = require('./categories.services.js')
const { getCategoryById } = require('../db/category.js')
const { addPostToSaved, removePostFromSaved, removeNotification } = require('../db/profile')
const { addNotificationToUserById } = require('../db/profile.js')
const { commentPost, getComments, deleteComment, flattenComments } = require('./comments.services.js')
const { deleteCommentsByIds } = require('../db/comments.js')

const { uploadImage } = require('./aws.services')

const { ObjectId } = require('mongodb');
const mongoose = require('mongoose')

const NotFoundError = require('../errors/NotFoundError')
const AppError = require('../errors/AppError');
const UnAuthorizedError = require('../errors/UnAuthorizedError');
const ConflictError = require('../errors/ConflictError');
const BadRequestError = require('../errors/BadRequestError');
const { LexRuntimeV2 } = require("aws-sdk")

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

    const category_data = await getCategoryById(category)

    if(!category_data.status) {
        throw new BadRequestError({
            errors: {
                body: {
                    category: {
                        message: 'Category not found!',
                        data: category
                    }
                }
            }
        })
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

    if(data.category) {
        const category_data = await getCategoryById(data.category)
    
        if(!category_data.status) {
            throw new BadRequestError({
                errors: {
                    body: {
                        category: {
                            message: 'Category not found!',
                            data: invalidIds
                        }
                    }
                }
            })
        }
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
            post: result.data._id
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
    
    let author = await getUserByQuery({ '_id': post.author })
    if(author.status) post.author = author.data

    return post
}

async function getPosts(params, expand) {
    if (!params) {
        throw new AppError({ message: "Missing required fields!" });
    }

    params = normalizePostIdsFilter(params);

    if (params.__emptyPostsResult) {
        delete params.__emptyPostsResult;

        return {
            status: true,
            message: "Success fetched posts",
            data: []
        };
    }

    const posts = await getPostsByQuery(params);

    if (!posts.status) {
        throw new NotFoundError({ message: "Posts not found!" });
    }

    await Promise.all(
        posts.data.map(async (post) => {
            const comments = await getComments(post._id);
            post.comments = comments.data;
        })
    );

    const expand_options = expand
        ? expand.split(",").map((e) => e.trim())
        : [];

    if (expand_options.includes("author")) {
        posts.data = await Promise.all(
            posts.data.map(insertAuthorToPost)
        );
    }

    if (expand_options.includes("category")) {
        const categories = await getCategories();

        await Promise.all(
            posts.data.map(async (post) => {
                post.category = categories.data.find(
                    (cat) => cat._id.toString() === post.category.toString()
                );
            })
        );
    }

    return {
        status: true,
        message: "Success fetched posts",
        data: posts.data
    };
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
    
    post.data.comments = await getComments(post.data._id, expand_options.includes("comments") ? "author" : null).data

    if(expand_options.includes("category")) {
        const category_data = await getCategoryById(post.data.category)
        if(category_data.status) {
            post.data.category = category_data.data
        }
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

    let users_with_saved_post = await getUsersByQuery({ saved_posts: new ObjectId(id) })

    if(users_with_saved_post.status) {
        for (const target_user of users_with_saved_post.data) {
            const result = await removePostFromSaved(target_user._id, id)
        }
    }

    const comments = await getComments(new ObjectId(id))

    const comments_to_delete = flattenComments(comments.data)

    const comments_delete_result = await deleteCommentsByIds(comments_to_delete)

    const result = await deletePostById(id)
    
    if(!result.status) {
        throw new NotFoundError({ message: "Failed to delete post!" })
    }

    await deleteFile(result.data.featured_image ?? "")

    const commentIds = comments_to_delete.map(comment => comment._id);

    await removeNotification({
        type: {
            $in: ["reply_comment", "like_comment"]
        },
        comment: {
            $in: commentIds
        }
    });

    await removeNotification({
        type: {
            $in: ["like_post", "comment_post"]
        },
        post: id
    });



    global.Logger.log({
        type: "delete_post",
        message: `User ${profile.nick_name} deleted post ${id}`,
        data: {
            post: result.data._id,
            user: profile._id
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

    return {
        status: true,
        message: "Success unsaved post",
        data: {
            saved_posts: result.data.saved_posts
        }
    }
}

async function likePost(profile, post_id) {
    if(!profile || !post_id) {
        throw new AppError({ message: "Missing required fields!" })
    }

    const post = await getPostByQuery({ "_id": post_id })

    if(!post.status) {
        throw new NotFoundError({ message: "Post not found!" })
    }

    if(post.data.likes.some((like) => String(like) === String(profile._id))) {
        throw new ConflictError({ message: "Post is already liked!" })
    }

    const result = await doLikeToPost(profile._id, post_id)

    const author = await getUserByQuery({ "_id": post.data.author })
    
    if(!author.data._id.equals(profile._id)) {
        await addNotificationToUserById(author.data._id, { type: "like_post", user: profile._id, post: post_id })
    }

    return {
        status: true,
        message: "Success liked post",
        data: { likes: result.data.likes}
    }
}

async function unlikePost(profile, post_id) {
    if(!profile || !post_id) {
        throw new AppError({ message: "Missing required fields!" })
    }

    const post = await getPostByQuery({ "_id": post_id })

    if(!post) {
        throw new NotFoundError({ message: "Post not found!" })
    }

    if(!post.data.likes.some((like) => String(like) === String(profile._id))) {
        throw new ConflictError({ message: "Post is not liked!" })
    }

    const result = await doUnlikePost(profile._id, post_id)

    return {
        status: true,
        message: "Success unliked post",
        data: { likes: result.data.likes}
    }
}

module.exports = {
    getPosts,
    getPostById,
    createPost,
    editPost,
    deletePost,
    savePost,
    unsavePost,
    likePost,
    unlikePost,
}