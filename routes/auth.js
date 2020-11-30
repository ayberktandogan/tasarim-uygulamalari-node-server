const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const standartSlugify = require("standard-slugify");
const MD5 = require("crypto-js/md5")
const { User, Pending_User, Role, User_Role } = require('../config/sequelize');
const { sendMail } = require('../helpers/mailer');

const router = express.Router()

// Validation objects
const { userRegisterScheme, userLoginScheme } = require('../validation/user');
const { _authCheck } = require('../middlewares/authCheck');

// @route   GET api/kullanici/kayit-ol
// @desc    Kullanıcıyı kaydet
// @access  Public
router.post('/kayit-ol', async (req, res, next) => {
    const { username, password, email } = req.body

    try {
        await userRegisterScheme.validateAsync(req.body)

        const userCheck = await User.findOne({ where: { username, email }, paranoid: false })

        if (userCheck) {
            return res.status(400).json({ message: "Kullanıcı adı veya email zaten kullanılıyor" })
        }

        const passwordHash = await bcrypt.hash(password, 10)

        const createUser = await User.create({
            username,
            email,
            password: passwordHash,
            slug: standartSlugify(username)
        })

        const confirmationHash = MD5(username + Date.now()).toString()

        await Pending_User.create({
            hash: confirmationHash,
            UserId: createUser.id
        })

        await sendMail({ type: "register_mail", hash: confirmationHash, to: email })

        return res.status(200).json({ message: "Kullanıcı başarıyla oluşturuldu. Lütfen mail adresinizi doğrulayın.", payload: { username, email, id: createUser.id } })
    } catch (err) {
        const res = await User.destroy({ where: { username }, force: true })
        err.statusCode = 400
        next(err)
    }
})

// @route   POST api/kullanici/giris-yap
// @desc    Kullanıcıya token üret
// @access  Public
router.post('/giris-yap', async (req, res, next) => {
    const { password, email } = req.body

    try {
        await userLoginScheme.validateAsync(req.body)

        const user = await User.findOne({ where: { email }, attributes: ["id", "username", "password", "isActivated"], include: [Role] })
        if (!user) {
            return res.status(400).json({ message: "Email adresi ya da şifre hatalı" })
        }

        if (!user.isActivated) {
            return res.status(401).json({ message: "Email hesabı doğrulanmamış!" })
        }

        const check = await bcrypt.compare(password, user.password)
        if (!check) return res.status(400).json({ message: "Email adresi ya da şifre hatalı" })

        const token = await jwt.sign(
            {
                user_id: user.id,
                username: user.username
            },
            process.env.LOG_SECRET_KEY,
            {
                algorithm: "HS512",
                expiresIn: process.env.NODE_ENV === "development" ? "365d" : "12h"
            }
        )

        console.log(_authCheck("see-admin-page", user))

        return res.status(200).json({
            success: true,
            token: "Bearer " + token,
            username: user.username,
            admin: await _authCheck("see-admin-page", user),
            exp: process.env.NODE_ENV === "development" ? (Date.now() + 315360000000) : (Date.now() + 43200000)
        })
    } catch (err) {
        next(err)
    }
})

// @route   GET api/kullanici/giris-yap
// @desc    Kullanıcıyı doğrula
// @access  Public
router.get('/kullanici-dogrula/:confirmationHash', async (req, res, next) => {
    const { confirmationHash } = req.params

    try {
        const pendingUser = await Pending_User.findOne({ where: { hash: confirmationHash } })

        if (!pendingUser) return res.status(404).json({ message: "Doğrulama IDsi bulunamadı!" })

        const defaultRole = await Role.findOne({ where: { slug: "default" } })
        if (!defaultRole) return res.status(500).json({ message: "Database sorunu!" })
        await User_Role.create({ UserId: pendingUser.UserId, RoleId: defaultRole.id })
        await User.update({ isActivated: 1 }, { where: { id: pendingUser.UserId } })
        await pendingUser.destroy()
        return res.status(200).json({ message: "Kullanıcı başarıyla doğrulandı." })
    } catch (err) {
        err.statusCode = 404
        next(err)
    }
})

module.exports = router;
