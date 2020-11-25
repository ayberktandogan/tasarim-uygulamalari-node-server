const express = require('express')
const { User } = require('../config/sequelize')

const router = express.Router()

const authCheck = require('../middlewares/authCheck')

// @route   GET api/kullanici/profil/:slug
// @desc    Kullanıcı profili
// @access  Public
router.get('/', authCheck('see-user'), async (req, res, next) => {
    try {
        const user = await User.findAll()
        if (!user) throw new Error("Kullanıcı bulunamadı", 404)

        res.status(200).json(user)
    } catch (err) {
        next(err)
    }
})

module.exports = router