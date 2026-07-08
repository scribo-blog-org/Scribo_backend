const NotFoundError = require("../errors/NotFoundError.js")
const { getCategoryById } = require ("../db/category.js")

const checkIsCategoryExistsMiddleware = async (req, res, next) => {
    try{

        let result
        
        if(req.body.category){
            result = await getCategoryById(req.body.category)
        }
        else {
            result = await getCategoryById(req.params.id)
        }

        if(!result.status) {
           throw new NotFoundError({ message: "Category not found" })
        }
        next()
    }
    catch(error) {
        next(error)
    }
}

module.exports = checkIsCategoryExistsMiddleware