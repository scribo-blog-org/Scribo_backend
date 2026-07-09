const { editCategory } = require("../../services/categories.services.js")

const editCategoryController = async (req, res, next) => {
    try {
        const result = await editCategory(req.params.id, req.body)
        return res.status(200).json(result)
    }
    catch(error) {
        next(error)
    }
}

module.exports = editCategoryController