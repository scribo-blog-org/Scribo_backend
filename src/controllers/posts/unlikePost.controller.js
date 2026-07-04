const { unLikePost } = require("../../services/posts.services")

const unLikePostController = async (req, res, next) => {
    try {
        const result = await unLikePost(req.profile, req.params.id);
        res.status(200).json(result);
    }
    catch(error) {
        next(error)
    }
}

module.exports = unLikePostController