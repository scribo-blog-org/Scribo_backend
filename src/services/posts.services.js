const { getUserByQuery, getUsersByQuery } = require('../db/users.db')
const { deleteFile } = require("./aws.services")
const { getPostByQuery, getPostsByQuery, createNewPost, deletePostById } = require('../db/posts')
const { addPostToSaved, removePostFromSaved } = require('../db/profile')

const { uploadImage } = require('./aws.services')

const { ObjectId } = require('mongodb');
const mongoose = require('mongoose')

const NotFoundError = require('../errors/NotFoundError')
const AppError = require('../errors/AppError');
const UnAuthorizedError = require('../errors/UnAuthorizedError');
const ConflictError = require('../errors/ConflictError');

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
    const posts = await getPostsByQuery(params)

    if(!posts.status) {
        throw new NotFoundError({ message: "Posts not found!" })
    }

    if(expand === "author") {
        for (let i = 0; i < posts.data.length; i++) {
            posts.data[i] = await insertAuthorToPost(posts.data[i])
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

    if(expand === "author") {
        post.data = await insertAuthorToPost(post.data)
    }
    
    return {
        status: true,
        message: "Success fetched post",
        data: post.data
    }
}

async function deletePost(id) {
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
            const result = await removePostFromSaved(target_user._id, id)

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

module.exports = {
    getPosts,
    getPostById,
    createPost,
    deletePost,
    savePost,
    unsavePost
}