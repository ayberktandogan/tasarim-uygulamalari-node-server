const Joi = require("joi")

const userRoleScheme = Joi.object({
    user_id: Joi.string().uuid().required(),
})

module.exports = { userRoleScheme }