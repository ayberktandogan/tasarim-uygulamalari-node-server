const Joi = require("joi")
const permission_list = require('../config/permission_list')

const roleScheme = Joi.object({
    title: Joi.string().required(),
    permission_list: Joi.array().items(Joi.string().valid(...permission_list)).required(),
    color: Joi.string().required()
})

module.exports = { roleScheme }