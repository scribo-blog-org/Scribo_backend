const NotFoundError = require("../errors/NotFoundError.js")
const ConflictError = require("../errors/ConflictError.js")
const { getCategoryById, getCategoryByName } = require ("../db/category.js")

const checkCategoryExistsByCategory = (shouldExist = true) => {
    return async (req, res, next) => {
       try {
   
            const result = await getCategoryById(req.body.category)
        
            if (result.status !== shouldExist) {
                if (shouldExist) {
                    throw new NotFoundError({ message: "Category not found" })
                }
                else {
                    throw new ConflictError({ message: "Category already exists" })
                }
            }
            next()
       }
       catch(error) {
           next(error)
       }
   }
}

module.exports = checkCategoryExistsByCategory