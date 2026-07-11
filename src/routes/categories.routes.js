const { Router } = require('express')
const router = Router()

const {
    editCategorySchema,
    createCategorySchema,
    deleteCategorySchema
} = require('../middlewares/validation/schemes')

const authMiddleware = require('../middlewares/auth.middleware')

const validateMiddleware = require('../middlewares/validation/validate.middleware')

const getCategoriesController = require('../controllers/categories/getCategories.controller')
const editCategoryController = require('../controllers/categories/editCategory.controller')
const createCategoryController = require('../controllers/categories/createCategory.controller')
const deleteCategoryController = require('../controllers/categories/deleteCategory.controller')

const CategoryPolicy = require('../authorization/policies/category.policy')

router.get(
    '/',
    getCategoriesController
)

router.patch(
    '/:id',
    validateMiddleware(editCategorySchema),
    authMiddleware,
    CategoryPolicy.canEdit,
    editCategoryController
)

router.post(
    '/',
    validateMiddleware(createCategorySchema),
    authMiddleware,
    CategoryPolicy.canCreate,
    createCategoryController
)

router.delete(
    '/:id',
    validateMiddleware(deleteCategorySchema),
    authMiddleware,
    CategoryPolicy.canDelete,
    deleteCategoryController
)

module.exports = router