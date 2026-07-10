const { getAllLogs } = require('../db/logs')

const getLogs = async () => {
    const result = await getAllLogs()

    return result
}

module.exports = {
    getLogs
}