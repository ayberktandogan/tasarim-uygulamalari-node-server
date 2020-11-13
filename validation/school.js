const Joi = require("joi")

const schoolScheme = Joi.object({
    name: Joi.string()
        .min(2)
        .required()
        .messages({
            'string.base': `"Okul adı" string olmalı`,
            'string.empty': `"Okul adı" boş bırakılamaz`,
            'string.min': `"Okul adı" en az 2 karakter olmalı`,
            'any.required': `"Okul adı" boş bırakılamaz`
        }),
    domain: Joi.string()
        .min(2)
        .required()
        .messages({
            'string.base': `"Okul domaini" string olmalı`,
            'string.empty': `"Okul domaini" boş bırakılamaz`,
            'string.min': `"Okul domaini" en az 2 karakter olmalı`,
            'any.required': `"Okul domaini" boş bırakılamaz`
        }),
    country: Joi.string()
        .min(2)
        .required()
        .messages({
            'string.base': `"Okulun bulunduğu şehir" string olmalı`,
            'string.empty': `"Okulun bulunduğu şehir" boş bırakılamaz`,
            'string.min': `"Okulun bulunduğu şehir" en az 2 karakter olmalı`,
            'any.required': `"Okulun bulunduğu şehir" boş bırakılamaz`
        }),
    webpage: Joi.string()
        .uri()
        .required()
        .messages({
            'string.base': `"Okulun websitesi" URI olmalı`,
        }),
    cover_art: Joi.string()
        .uri()
        .messages({
            'string.base': `"Okulun logosu" URI olmalı`,
        }),
    isActivated: Joi.boolean()
        .messages({
            'string.base': `"Aktivasyon durumu" bool olmalı`,
        })
})

const schoolAddScheme = Joi.object({
    school_name: Joi.string()
        .min(2)
        .required()
        .messages({
            'string.base': `"Okul adı" string olmalı`,
            'string.empty': `"Okul adı" boş bırakılamaz`,
            'string.min': `"Okul adı" en az 2 karakter olmalı`,
            'any.required': `"Okul adı" boş bırakılamaz`
        })
})

module.exports = { schoolScheme, schoolAddScheme }