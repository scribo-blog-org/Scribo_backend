const { Router } = require('express')
const router = Router()

const { getPostByIdSchema,
    createPostSchema,
    deletePostSchema
} = require('../middlewares/validation/schemes')

const uploadMiddleware = require('../middlewares/upload.middleware')

const validateMiddleware = require('../middlewares/validation/validate.middleware')

const authMiddleware = require('../middlewares/auth.middleware')
const checkAccessMiddleware = require('../middlewares/checkAccess.middleware')

const getPostsController = require('../controllers/posts/getPosts.controller')
const getPostByIdController = require('../controllers/posts/getPostById.controller')
const createPostController = require('../controllers/posts/createPost.controller')

router.get(
    '/',
    getPostsController
)

router.get(
    '/:id',
    getPostByIdSchema,
    getPostByIdController
)

router.post(
    '/', 
    authMiddleware,
    checkAccessMiddleware,
    uploadMiddleware(['feature_image']),
    validateMiddleware(createPostSchema),
    createPostController
)

router.delete(
    '/:id',
    authMiddleware,
    checkAccessMiddleware,
    validateMiddleware(deletePostSchema),
    deletePostController
)

module.exports = router