const { unlikeComment } = require('../../services/comments.services')


const unlikeCommentController = async (req, res, next) => {
    try {
        const result = await unlikeComment(req.params.id, req.profile)
        
        res.status(200).json(result)
    }
    catch(error) {
        next(error)
    }
}

module.exports = unlikeCommentController  