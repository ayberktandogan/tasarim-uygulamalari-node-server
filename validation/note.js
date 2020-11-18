const Joi = require("joi")

const noteScheme = Joi.object({
    name: Joi.string().min(2).max(255).required(),
    manga_pages: Joi.any(),
    isActivated: Joi.boolean(),
    SchoolId: Joi.string().uuid().required(),
    DepartmentId: Joi.string().uuid().required()
})

module.exports = { noteScheme }