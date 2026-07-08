const NotFoundError = require("../errors/NotFoundError.js")
const ConflictError = require("../errors/ConflictError.js")
const { getCategoryById, getCategoryByName } = require ("../db/category.js")

const checkIsCategoryExistsMiddleware = (shouldExist = true) => {
    return async (req, res, next) => {
       try {
   
            let result
            
            if(req.body.name){
                result = await getCategoryByName(req.body.name)
            }
            else {
                result = await getCategoryById(req.params.id)
            }
            
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

module.exports = checkIsCategoryExistsMiddleware