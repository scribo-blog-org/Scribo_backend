const { deleteComment } = require('../../services/comments.services')

const deleteCommentController = async (req, res, next) => {
    const result = await deleteComment(req.params.id)


    res.status(200).json(result)
}

module.exports = deleteCommentController