const { getLogs } = require('../../services/logs.services')


const getLogsController = async (req, res, next) => {
    try {
        const result = await getLogs()
        res.status(200).json(result)
    }
    catch(e) {
        next(e)
    }
}

module.exports = getLogsController