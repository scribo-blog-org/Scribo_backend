const { savePost } = require("../../services/posts.services")

const savePostController = async (req, res, next) => {
    try {
        const result = await savePost(req.profile, req.params.id);
        res.status(200).json(result);
    }
    catch(error) {
        next(error)
    }
}

module.exports = savePostController