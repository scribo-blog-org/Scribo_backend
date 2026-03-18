const deletePost = require('../../services/posts.services')

const deletePostController = async (req, res, next) => {
    try {
        const result = await deletePost(req)

        res.status(200).json(result)
    }
    catch(error) {
        next(error)
    }
}

module.exports = deletePostController