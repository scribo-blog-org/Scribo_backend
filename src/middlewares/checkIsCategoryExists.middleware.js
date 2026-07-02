const BadRequestError = require("../errors/BadRequestError")
const { getAllCategories } = require ("../db/category.js")

const checkIsCategoryExistsMiddleware = async (req, res, next) => {
    try {
        const all_categories = await getAllCategories()
        
        if(!all_categories.status || !all_categories.data.some(cat => cat.name === req.body.category)) {
            throw new BadRequestError({
                errors: {
                    body: {
                        category: {
                            message: 'Invalid category!',
                            data: req.body.category
                        }
                    }
                }
            })
        }

        next()
    }
    catch(error) {
        next(error)
    }
}

module.exports = checkIsCategoryExistsMiddleware