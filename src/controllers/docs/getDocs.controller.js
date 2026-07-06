const getDocsJson = require('../../services/docs.service')

const getDocs = async (req, res, next) => {
    try{
        const docs = getDocsJson(req, res, next);
        res.status(200).json(docs)
    }
    catch(e) {
        next(e)
    }
}

module.exports = getDocs