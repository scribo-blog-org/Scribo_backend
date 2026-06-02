const { commentPost } = require('../../services/posts.services')

const commentsController = async (req, res, next) => {
    try {
        const result = await commentPost(req.params.id, req.body, req.profile, req.query.expand)
    
        res.status(200).json(result)
    }
    catch(error) {
        next(error)
    }
}

module.exports = commentsController  