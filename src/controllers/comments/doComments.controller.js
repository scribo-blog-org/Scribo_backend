const { commentPost } = require('../../services/posts.services')

const doCommentController = async (req, res, next) => {
    try {
        const result = await commentPost(req.params.id, req.body.comment_text, req.body.parent_comment_id, req.profile)
    
        res.status(200).json(result)
    }
    catch(error) {
        next(error)
    }
}

module.exports = doCommentController  