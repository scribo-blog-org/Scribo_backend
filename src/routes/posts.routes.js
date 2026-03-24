const { Router } = require('express')
const router = Router()

const {
    getPostByIdSchema,
    createPostSchema,
    deletePostSchema,
    savePostSchema,
    getPostsSchema
} = require('../middlewares/validation/schemes')

const uploadMiddleware = require('../middlewares/upload.middleware')

const validateMiddleware = require('../middlewares/validation/validate.middleware')

const authMiddleware = require('../middlewares/auth.middleware')
const checkAccessMiddleware = require('../middlewares/checkAccess.middleware')

const getPostsController = require('../controllers/posts/getPosts.controller')
const getPostByIdController = require('../controllers/posts/getPostById.controller')
const createPostController = require('../controllers/posts/createPost.controller')
const deletePostController = require('../controllers/posts/deletePost.controller')
const savePostController = require('../controllers/posts/savePost.controller')
const unsavePostController = require('../controllers/posts/unsavePost.controller')

router.get(
    '/',
    validateMiddleware(getPostsSchema),
    getPostsController
)

router.get(
    '/:id',
    validateMiddleware(getPostByIdSchema),
    getPostByIdController
)

router.post(
    '/', 
    authMiddleware,
    checkAccessMiddleware,
    uploadMiddleware(['featured_image']),
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

router.post(
    '/:id/save',
    authMiddleware,
    validateMiddleware(savePostSchema),
    savePostController
)

router.delete(
    '/:id/save',
    authMiddleware,
    validateMiddleware(savePostSchema),
    unsavePostController
)

module.exports = router