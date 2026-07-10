const Logs = require("../models/Log")

const getAllLogs = async () => {
    const result = await Logs.find().sort({ createdAt: -1 }).lean()

    if(!result) {
        return {
            status: false,
            message: "Logs not found!",
            data: null
        }
    }

    return {
        status: true,
        message: "Success",
        data: result
    }
}

module.exports = {
    getAllLogs
}