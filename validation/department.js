const Joi = require("joi")
const allowedSchoolList = require('../config/allowed_departments_list')

const departmentScheme = Joi.object({
    name: Joi.string().valid(...allowedSchoolList)
        .min(2)
        .required()
        .messages({
            'string.base': `"Bölüm adı" string olmalı`,
            'string.empty': `"Bölüm adı" boş bırakılamaz`,
            'string.min': `"Bölüm adı" en az 2 karakter olmalı`,
            'any.required': `"Bölüm adı" boş bırakılamaz`
        }),
    SchoolId: Joi.string()
        .uuid()
        .required()
        .messages({
            'string.base': `"Okul idsi" UUID olmalı`,
            'string.empty': `"Okul idsi" boş bırakılamaz`,
            'any.required': `"Okul idsi" boş bırakılamaz`
        }),
    isActivated: Joi.boolean()
        .messages({
            'string.base': `"Aktivasyon durumu" bool olmalı`,
        }),
})

module.exports = { departmentScheme }