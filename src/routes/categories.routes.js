const { Router } = require('express')
const router = Router()

const {
    editCategorySchema,
    createCategorySchema,
    deleteCategorySchema
} = require('../middlewares/validation/schemes')

const authMiddleware = require('../middlewares/auth.middleware')
const checkAdminAccessMiddleware = require('../middlewares/checkAccess.middleware')
const checkIsCategoryExistsMiddleware = require('../middlewares/checkIsCategoryExists.middleware')

const validateMiddleware = require('../middlewares/validation/validate.middleware')

const getCategoriesController = require('../controllers/categories/getCategories.controller')
const editCategoryController = require('../controllers/categories/editCategory.controller')
const createCategoryController = require('../controllers/categories/createCategory.controller')
const deleteCategoryController = require('../controllers/categories/deleteCategory.controller')

router.get(
    '/',
    getCategoriesController
)

router.patch(
    '/:id',
    validateMiddleware(editCategorySchema),
    authMiddleware,
    checkAdminAccessMiddleware,
    checkIsCategoryExistsMiddleware(true),
    editCategoryController
)

router.post(
    '/',
    validateMiddleware(createCategorySchema),
    authMiddleware,
    checkAdminAccessMiddleware,
    checkIsCategoryExistsMiddleware(false),
    createCategoryController
)

router.delete(
    '/:id',
    validateMiddleware(deleteCategorySchema),
    authMiddleware,
    checkAdminAccessMiddleware,
    checkIsCategoryExistsMiddleware(true),
    deleteCategoryController
)

module.exports = router