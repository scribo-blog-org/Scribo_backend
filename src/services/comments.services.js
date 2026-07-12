const NotFoundError = require('../errors/NotFoundError');

const { addCommentToPost, addReplyToComment, getCommentsByPostId, getCommentsByQuery, deleteCommentById, getCommentById, deleteCommentsByIds } = require('../db/comments')
const { getPostByQuery } = require('../db/posts')
const { getUserByQuery } = require('../db/users.db')
const { addNotificationToUserById } = require('../db/profile')

async function commentPost(post_id, comment_text, parent_comment_id, profile) {
    if(!post_id || !comment_text || !profile) {
        throw new AppError({ message: "Missing required fields!" })
    }
    
    let result

    
    if(parent_comment_id) {
        result = await addReplyToComment(parent_comment_id, comment_text, profile._id)
        
        if(result.status !== true) { 
            throw new NotFoundError({ message: result.message })
        }

        const comment_author = (await getCommentsByQuery({ _id: parent_comment_id })).data[0].author
        
        if(comment_author.toString() !== profile._id.toString()) {
            const res = await addNotificationToUserById(comment_author, { type: "reply_comment", user: profile._id, comment: result.data._id, post: post_id })
        }
    }

    else {
        result = await addCommentToPost(post_id, comment_text, profile._id)
        
        const post_author = (await getPostByQuery({ _id: post_id })).data.author
        
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
    const post = await getPostByQuery({ "_id": post_id })

    if(!post.status) {
        throw new NotFoundError({ message: "Post not found!" })
    }

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

async function deleteComment(comment_id) {
    const root_comment = await getCommentById(comment_id)

    if(!root_comment.status) {
        throw new NotFoundError({ message: root_comment.message })
    }
    
    const replies = await get_replies(comment_id, null)
    const comments_to_delete = flattenComments(replies)
    comments_to_delete.push(root_comment.data)

    const result = await deleteCommentsByIds(comments_to_delete)

    return {
        status: true,
        message: "Success deleted comment",
        data: null
    }
}

function flattenComments(comments) {
    const result = [];

    function walk(items) {
        for (const comment of items) {
            result.push(comment);

            if (comment.replies?.length) {
                walk(comment.replies);
            }
        }
    }

    walk(comments);

    return result;
}

module.exports = {
    commentPost,
    getComments,
    deleteComment,
    flattenComments
}