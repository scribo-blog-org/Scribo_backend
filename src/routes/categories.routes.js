const { Router } = require('express')
const router = Router()

const {
    editCategorySchema,
    createCategorySchema,
    deleteCategorySchema
} = require('../middlewares/validation/schemes')

const authMiddleware = require('../middlewares/auth.middleware')
const checkAdminAccessMiddleware = require('../middlewares/checkAccess.middleware')
const checkCategoryExistsById = require('../middlewares/checkCategoryExistsById.middleware')
const checkCategoryExistsByName = require('../middlewares/checkCategoryExistsByName.middleware')

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
    checkCategoryExistsById(true),
    editCategoryController
)

router.post(
    '/',
    validateMiddleware(createCategorySchema),
    authMiddleware,
    checkAdminAccessMiddleware,
    checkCategoryExistsByName(false),
    createCategoryController
)

router.delete(
    '/:id',
    validateMiddleware(deleteCategorySchema),
    authMiddleware,
    checkAdminAccessMiddleware,
    checkCategoryExistsById(true),
    deleteCategoryController
)

module.exports = router