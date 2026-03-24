const { createPost } = require('../../services/posts.services')

const createPostController = async (req, res, next) => {
    try {
        const result = await createPost({
            title: req.body.title,
            content_text: req.body.content_text,
            category: req.body.category,
            featured_image: req.file,
            profile: req.profile
        })
    
        res.status(200).json(result)
    }
    catch(error) {
        next(error)
    }
}

module.exports = createPostController