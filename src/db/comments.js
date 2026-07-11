const postComment = require('../models/PostComment')
const Post = require('../models/Post')

async function addCommentToPost(post_id, comment_text, author_id) {
    const post = await Post.findById(post_id)
    if(!post) {
        return {
            status: false,
            message: "Post not found!",
            data: null
        }
    }

    const newComment = await postComment.create({
        post_id: post_id,
        comment_text: comment_text,
        author: author_id
    })
    await newComment.save()

    return {
        status: true,
        message: "Success added comment",
        data: newComment
    }
}

async function addReplyToComment(parent_comment_id, comment_text, author_id) {
    const comment = await postComment.findById(parent_comment_id)

    if(!await postComment.findById(parent_comment_id)) {
        return {
            status: false,
            message: "Parent comment not found!",
            data: null
        }
    }

    const newComment = await postComment.create({
        comment_text: comment_text,
        author: author_id,
        parent_comment_id: parent_comment_id
    })

    await newComment.save()

    return {
        status: true,
        message: "Success added comment",
        data: newComment
    }
}

async function getCommentsByPostId(post_id) {
    const comments = await postComment.find({ post_id: post_id })

    return {
        status: true,
        message: "Success get comments",
        data: comments
    }
}

async function getCommentById(comment_id) {
    const comment = await postComment.findById(comment_id).lean()

    if(!comment) {
        return {
            status: false,
            message: "Comment not found!",
            data: null
        }
    }

    return {
        status: true,
        message: "Success get comment",
        data: comment
    }
}

async function getCommentsByQuery(query = {}) {
    const posts = await postComment.find(query).lean()
    
    if (!posts.length) {
        return {
            status: false,
            message: "There is no comments!",
            data: null
        }
    }

    return {
        status: true,
        message: "Success",
        data: posts
    }
}

async function deleteCommentById(comment_id) {
    const result = await postComment.deleteOne({ _id: comment_id })

    if(!result.deletedCount) {
        return {
            status: false,
            message: "There is no comments to delete!",
            data: null
        }
    }

    return {
        status: true,
        message: "Success deleted comments",
        data: result
    }

}

async function deleteCommentsByIds(comment_ids) {
    const result = await postComment.deleteMany({ _id: { $in: comment_ids } }).lean()

    if(!result.deletedCount) {
        return {
            status: false,
            message: "There is no comments to delete!",
            data: null
        }
    }
    
    return {
        status: true,
        message: "Success deleted comments",
        data: null
    }
}

module.exports = {
    addCommentToPost,
    addReplyToComment,
    getCommentsByPostId,
    getCommentsByQuery,
    deleteCommentById,
    getCommentById,
    deleteCommentsByIds
}