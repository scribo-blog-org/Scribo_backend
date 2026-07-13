const { editComment } = require('../../services/comments.services')

const editCommentController = async (req, res, next) => {
    const result = await editComment(req.params.id, req.body.comment_text)
    res.status(200).json(result)
}

module.exports = editCommentController