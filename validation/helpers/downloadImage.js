const Joi = require("joi")

const downloadImageScheme = Joi.object({
    image_url: Joi.string().uri().required(),
    school_id: Joi.string().uuid().required(),
})

module.exports = { downloadImageScheme }