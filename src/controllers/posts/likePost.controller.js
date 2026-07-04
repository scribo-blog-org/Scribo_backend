const { likePost } = require("../../services/posts.services")

const likePostController = async (req, res, next) => {
    try {
        const result = await likePost(req.profile, req.params.id);
        res.status(200).json(result);
    }
    catch(error) {
        next(error)
    }
}

module.exports = likePostController