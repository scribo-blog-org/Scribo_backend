const { editPost } = require('../../services/posts.services')

const editPostController = async (req, res, next) => {
    try {
        const result = await editPost(req.params.id, {
            title: req.body.title,
            content_text: req.body.content_text,
            category: req.body.category,
            featured_image: req.file
        }, req.profile)

        res.status(200).json(result)
    }
    catch(error) {
        next(error)
    }
}

module.exports = editPostController