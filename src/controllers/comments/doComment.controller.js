const { commentPost } = require('../../services/comments.services')

const doCommentController = async (req, res, next) => {
    try {
        const result = await commentPost({
            post_id: req.params.id,
            comment_text: req.body.comment_text,
            parent_comment_id: req.body.parent_comment_id,
            profile: req.profile
        })
    
        res.status(200).json(result)
    }
    catch(error) {
        next(error)
    }
}

module.exports = doCommentController