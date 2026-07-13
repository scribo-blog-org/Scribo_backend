const { likeComment } = require('../../services/comments.services')


const likeCommentController = async (req, res, next) => {
    try {
        const result = await likeComment(req.params.id, req.profile)
        
        res.status(200).json(result)
    }
    catch(error) {
        next(error)
    }
}

module.exports = likeCommentController  