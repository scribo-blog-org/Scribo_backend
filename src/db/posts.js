const Post = require('../models/Post')

async function getPostsByQuery(query = {}) {
    const posts = await Post.find(query)
    
    if (!posts.length) {
        return {
            status: false,
            message: "There is no posts",
            data: null
        }
    }

    return {
        status: true,
        message: "Success",
        data: posts
    }
}

async function getPostByQuery(query = {}) {
    const post = await Post.findOne(query)
    
    if (!post) {
        return {
            status: false,
            message: "Post not found!",
            data: null
        }
    }

    return {
        status: true,
        message: "Success",
        data: post
    }
}

async function createNewPost(title, content_text, category, author, featured_image=null) {
    const new_post = await Post.create({
        author: author,
        title: title,
        featured_image: featured_image,
        content_text: content_text,
        category: category
    })

    return {
        status: true,
        message: "Success created post",
        data: new_post
    }
}

async function deletePostById(id) {
    const deleted_post = await Post.findByIdAndDelete(id);

    if(!deleted_post) {
        return {
            status: false,
            message: "This post doesn`t exists",
            data: null
        }
    }
    
    return {
        status: true,
        message: "Success deleted post",
        data: deleted_post
    }
}

module.exports = {
    getPostsByQuery,
    getPostByQuery,
    createNewPost,
    deletePostById
}