const express = require('express')
const standartSlugify = require("standard-slugify")
const _ = require('lodash')
const { Manga } = require('../config/sequelize')
const authCheck = require('../middlewares/authCheck')
const { userRoleScheme } = require('../validation/user_role')

const router = express.Router()

const { User, Role } = require('../config/sequelize')

// @route   GET api/kullanici-rol/:role_id
// @desc    Rolde bulunan kullanıcıları göster
// @access  Private
router.get('/:role_id', authCheck('see-user-role'), async (req, res, next) => {
    try {
        const { role_id } = req.params

        const usersInRole = await Role.findByPk(role_id, { include: User })

        res.status(200).json(usersInRole.Users)
    } catch (err) {
        res.status(500).json({ message: "Internal server error!" })
        console.log(err)
    }
})

// @route   POST api/kullanici-rol/:role_id
// @desc    Role kullanıcı ekle
// @access  Private (add-role)
router.post('/:role_id', authCheck('add-user-role'), async (req, res, next) => {
    const { role_id } = req.params
    const { user_id } = req.body
    try {
        await userRoleScheme.validateAsync(req.body)

        const user = await User.findByPk(user_id)

        // Kullanıcının sahip olduğu rolleri al
        const userRoles = await user.getRoles()

        const tempRoleList = []
        // Bu rolleri döndür ve geçici arraye ekle
        if (userRoles)
            for (const roleObj of userRoles) {
                tempRoleList.push(roleObj.id)
            }
        // Kullanıcının zaten sahip olduğu rolleri ve yeni rolü bir arraye dönüştür, kaydet
        await user.setRoles([...tempRoleList, role_id])

        res.status(200).json({ message: "success" })
    } catch (err) {
        res.status(500).json({ message: "Internal server error!" })
        console.log(err)
    }
})

// @route   DELETE api/kullanici-rol/
// @desc    Rolden kullanıcı sil
// @access  Private
router.delete('/:role_id', authCheck('delete-user-role'), async (req, res, next) => {
    const { role_id } = req.params
    const { user_id } = req.body
    try {
        await userRoleScheme.validateAsync(req.body)

        const user = await User.findByPk(user_id)

        // Kullanıcının kayıtlı olduğu rolleri geçici bir arraye al
        const tempRoleList = await user.getRoles()
        // Eğer bu array boşşa hata döndür
        if (!tempRoleList) return res.status(500).json({ message: "Kullanıcı hiçbir role kayıtlı değil!" })
        // Bu geçici arrayden, istenilen rolü sil
        _.remove(tempRoleList, function (n) {
            return n.id == role_id
        })
        // Kaydet
        await user.setRoles(tempRoleList)

        res.status(200).json({ message: "success" })
    } catch (err) {
        res.status(500).json({ message: "Internal server error!" })
        console.log(err)
    }

    res.status(200)
})

module.exports = router