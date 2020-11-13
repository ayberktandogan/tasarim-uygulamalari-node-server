const express = require('express')
const standartSlugify = require("standard-slugify")
const { Department } = require('../config/sequelize')
const authCheck = require('../middlewares/authCheck')

const { departmentScheme } = require('../validation/department')

const router = express.Router()

// @route   GET api/bolum/
// @desc    Bölüm listesi
// @access  Public
router.get('/admin', authCheck('see-department'), async (req, res, next) => {
    try {
        const departmentList = await Department.unscoped().findAll()
        if (!departmentList) throw new Error("Hiç bölüm bulunamadı!", 404)

        res.status(200).json(departmentList)
    } catch (err) {
        next(err)
    }
})

// @route   GET api/bolum/
// @desc    Bölüm listesi
// @access  Public
router.get('/', async (req, res, next) => {
    try {
        const departmentList = await Department.findAll()
        if (!departmentList) throw new Error("Hiç bölüm bulunamadı!", 404)

        res.status(200).json(departmentList)
    } catch (err) {
        next(err)
    }
})

// @route   POST api/bolum/
// @desc    Bölüm ekle
// @access  Private (add-department)
router.post('/', authCheck('add-department'), async (req, res, next) => {
    try {
        await departmentScheme.validateAsync(req.body)

        const department = await Department.unscoped().findOne({ where: { slug: standartSlugify(req.body.name), SchoolId: req.body.SchoolId } })
        if (department) throw new Error("Bölüm zaten var!", 400)

        // Bölümü oluştur, bölümü açan kişinin idsini ve bölüm slug'ını özel oluştur
        const newDepartment = await Department.create({ ...req.body, isActivated: 0, UserId: req.authUser.id, slug: standartSlugify(req.body.name) })

        res.status(200).json(newDepartment)
    } catch (err) {
        next(err)
    }
})

// @route   PUT api/bolum/
// @desc    Bölüm güncelle
// @access  Private (update-department)
router.put('/:id', authCheck('update-department'), async (req, res, next) => {
    const { id } = req.params
    try {
        await departmentScheme.validateAsync(req.body)

        let department = await Department.unscoped().findByPk(id)
        if (!department) throw new Error("Bölüm bulunamadı", 404)

        await department.update({ ...req.body })

        res.status(200).json(department)
    } catch (err) {
        next(err)
    }
})

// @route   DELETE api/bolum/
// @desc    Bölüm sil
// @access  Private (delete-department)
router.delete('/:id', authCheck('delete-department'), async (req, res, next) => {
    const { id } = req.params
    try {
        const department = await Department.unscoped().findByPk(id)
        if (!department) throw new Error("Bölüm bulunamadı", 404)

        await department.destroy()

        res.status(200).json({ message: "Bölüm başarıyla silindi." })
    } catch (err) {
        next(err)
    }
})

module.exports = router