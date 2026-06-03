const { editPost } = require('../../services/posts.services')

const editPostController = async (req, res, next) => {
    try {
        let data = {}

        data.body = req.body.title
        data.content_text = req.body.content_text
        data.category = req.body.category

         if(Object.keys(req.body).includes("featured_image") || req.file) {
            data['featured_image'] = req.file
        }
        const result = await editPost(req.params.id, data, req.profile)

        res.status(200).json(result)
    }
    catch(error) {
        next(error)
    }
}

module.exports = editPostController