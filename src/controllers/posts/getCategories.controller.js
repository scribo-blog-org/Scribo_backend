const { getCategories } = require('../../services/posts.services')

const getCategoriesController = async (req, res, next) => {
    try {
        const result = await getCategories()

        res.status(200).json(result)
    }
    catch(error) {
        next(error)
    }
}

module.exports = getCategoriesController