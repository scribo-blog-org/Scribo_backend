const { deleteCategory } = require("../../services/categories.services.js")

const deleteCategoryController = async (req, res, next) => {
    try {
        const result = await deleteCategory(req.params.id)
        return res.status(200).json(result)
    }
    catch(error) {
        next(error)
    }
}

module.exports = deleteCategoryController