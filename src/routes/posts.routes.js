const { Router } = require('express')
const router = Router()

const {
    getPostByIdSchema,
    createPostSchema,
    editPostSchema,
    deletePostSchema,
    savePostSchema,
    getPostsSchema,
    commentsSchema,
    likePostSchema,
    deleteCommentSchema
} = require('../middlewares/validation/schemes')

const uploadMiddleware = require('../middlewares/upload.middleware')

const validateMiddleware = require('../middlewares/validation/validate.middleware')

const authMiddleware = require('../middlewares/auth.middleware')

const getPostsController = require('../controllers/posts/getPosts.controller')
const getPostByIdController = require('../controllers/posts/getPostById.controller')
const createPostController = require('../controllers/posts/createPost.controller')
const editPostController = require('../controllers/posts/editPost.controller')
const deletePostController = require('../controllers/posts/deletePost.controller')
const savePostController = require('../controllers/posts/savePost.controller')
const unsavePostController = require('../controllers/posts/unsavePost.controller')
const doCommentController = require('../controllers/comments/doComments.controller')
const getCommentsController = require('../controllers/comments/getComments.controller')
const likePostController = require('../controllers/posts/likePost.controller')
const unlikePostController = require('../controllers/posts/unlikePost.controller')

const PostPolicy = require('../authorization/policies/post.policy')


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
    uploadMiddleware(['featured_image']),
    validateMiddleware(createPostSchema),
    PostPolicy.canCreate,
    createPostController
)

router.patch(
    '/:id',
    authMiddleware,
    uploadMiddleware(['featured_image']),
    validateMiddleware(editPostSchema),
    PostPolicy.canEdit,
    editPostController
)

router.post(
    '/:id/comments',
    authMiddleware,
    validateMiddleware(commentsSchema),
    doCommentController
)

router.get(
    '/:id/comments',
    validateMiddleware(getPostByIdSchema),
    getCommentsController
)

router.delete(
    '/:id',
    authMiddleware,
    PostPolicy.canDelete,
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

router.post(
    '/:id/like',
    authMiddleware,
    validateMiddleware(likePostSchema),
    likePostController
)

router.delete(
    '/:id/like',
    authMiddleware,
    validateMiddleware(likePostSchema),
    unlikePostController
)


module.exports = router