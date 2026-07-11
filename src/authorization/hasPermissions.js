const rolePermissions = require("./rolePermissions");

module.exports = (profile, permission) => {
    return rolePermissions[profile.role]?.includes(permission);
};