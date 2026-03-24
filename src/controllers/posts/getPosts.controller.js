const { getPosts } = require('../../services/posts.services')

const getPostsController = async (req, res, next) => {
    try { 
        const params = req.query
        const expand = params.expand ?? null
        delete params.expand

        const result = await getPosts(params, expand)

        res.status(200).json(result)
    }
    catch(error) {
        next(error)
    }
}

module.exports = getPostsController