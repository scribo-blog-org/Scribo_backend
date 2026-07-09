const { createCategory } = require("../../services/categories.services.js")

const createCategoryController = async (req, res, next) => {
    try {
        const result = await createCategory({
            name: req.body.name,
            icon: req.body.icon,
            color: req.body.color
        })
        return res.status(200).json(result)
    }
    catch(error) {
        next(error)
    }
}

module.exports = createCategoryController