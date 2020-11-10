const Joi = require("joi")

const schoolScheme = Joi.object({
    school_name: Joi.string()
        .alphanum()
        .min(2)
        .required()
        .messages({
            'string.base': `"Okul adı" string olmalı`,
            'string.empty': `"Okul adı" boş bırakılamaz`,
            'string.min': `"Okul adı" en az 2 karakter olmalı`,
            'any.required': `"Okul adı" boş bırakılamaz`
        })
})

module.exports = { schoolScheme }