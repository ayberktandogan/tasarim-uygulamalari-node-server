const Joi = require("joi")

const userRegisterScheme = Joi.object({
    username: Joi.string()
        .alphanum()
        .min(3)
        .max(20)
        .required()
        .messages({
            'string.base': `"Kullanıcı adı" string olmalı`,
            'string.empty': `"Kullanıcı adı" boş bırakılamaz`,
            'string.min': `"Kullanıcı adı" en az 3 karakter olmalı`,
            'string.max': `"Kullanıcı adı" en fazla 20 karakter olabilir`,
            'any.required': `"Kullanıcı adı" boş bırakılamaz`
        }),
    password: Joi.string()
        .required()
        .min(6)
        .messages({
            'string.base': `"Şifre" string olmalı`,
            'string.empty': `"Şifre" boş bırakılamaz`,
            'string.min': `"Şifre" en az 6 karakter olmalı`,
            'any.required': `"Şifre" boş bırakılamaz`
        }),
    repeat_password: Joi.ref('password'),
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': `Email adresinizle kayıt olmanız gerekiyor`,
        })
}).with('password', 'repeat_password')

const userLoginScheme = Joi.object({
    password: Joi.string()
        .required()
        .min(6)
        .messages({
            'string.base': `"Şifre" string olmalı`,
            'string.empty': `"Şifre" boş bırakılamaz`,
            'string.min': `"Şifre" en az 6 karakter olmalı`,
            'any.required': `"Şifre" boş bırakılamaz`
        }),
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': `Email adresinizle giriş yapmanız gerekiyor`,
        })
})

module.exports = { userRegisterScheme, userLoginScheme }