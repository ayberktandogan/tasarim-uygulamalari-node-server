const express = require('express')
const authCheck = require('../middlewares/authCheck')
const { roleScheme } = require('../validation/role')

const router = express.Router()

const { Role } = require('../config/sequelize')

// @route   GET api/rol/
// @desc    Rol listesi
// @access  Private (see-role)
router.get('/', authCheck('see-role'), async (req, res, next) => {
    try {
        const roleList = await Role.findAll()
        if (!roleList) throw new Error(["Hiç rol bulunamadı!", 404])

        res.status(200).json(roleList)
    } catch (err) {
        next(err)
    }
})

// @route   POST api/rol/
// @desc    Rol ekle
// @access  Private (add-role)
router.post('/', authCheck('add-role'), async (req, res, next) => {
    try {
        await roleScheme.validateAsync(req.body)

        const role = await Role.findOne({ where: { title: req.body.title } })
        if (role) throw new Error(["Rol zaten var!", 400])

        const newRole = await Role.create({ ...req.body, createdById: req.authUser.id })

        res.status(200).json(newRole)
    } catch (err) {
        next(err)
    }
})

// @route   PUT api/rol/
// @desc    Rol güncelle
// @access  Private (update-role)
router.put('/:id', authCheck('update-role'), async (req, res, next) => {
    const { id } = req.params
    try {
        await roleScheme.validateAsync(req.body)

        let role = await Role.findByPk(id)
        if (!role) throw new Error(["Rol bulunamadı", 404])

        let duplicateRole = await Role.findOne({ where: { title: req.body.title } })
        if (duplicateRole) throw new Error("Bu rol adı kullanılıyor!", 400)

        await role.update(req.body)

        res.status(200).json(role)
    } catch (err) {
        next(err)
    }
})

// @route   DELETE api/rol/
// @desc    Rol sil
// @access  Private (delete-role)
router.delete('/:id', authCheck('delete-role'), async (req, res, next) => {
    const { id } = req.params
    try {
        const role = await Role.findByPk(id)
        if (!role) throw new Error(["Rol bulunamadı", 404])

        await role.destroy()

        res.status(200).json({ message: "Rol başarıyla silindi." })
    } catch (err) {
        next(err)
    }
})

module.exports = router