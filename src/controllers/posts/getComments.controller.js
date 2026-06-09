const { getComments } = require('../../services/posts.services')

const getCommentsController = async (req, res, next) => {
    try {
        const result = await getComments(req.params.id, req.query.expand)

        res.status(200).json(result)
    }
    catch(error) {
        next(error)
    }
}

module.exports = getCommentsController  