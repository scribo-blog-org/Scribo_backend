const bcrypt = require("bcryptjs")

function setPasswordHash(password) {
    return bcrypt.hashSync(password, process.env.PSSWORD_SALT)
}

function compare_passwords(password, from_db) {    
    return bcrypt.compare(password, from_db)
}

module.exports = {
    setPasswordHash,
    compare_passwords
}