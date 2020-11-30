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
        if (!departmentList) return res.status(404).json({ message: "Bölüm bulunamadı!" })

        res.status(200).json(departmentList)
    } catch (err) {
        res.status(500).json({ message: "Internal server error!" })
        console.log(err)
    }
})

// @route   GET api/bolum/
// @desc    Bölüm listesi
// @access  Public
router.get('/', async (req, res, next) => {
    const { limit } = req.query
    try {
        const departmentList = await Department.findAll({ limit: Number(limit) || undefined, order: ["name"] })
        if (!departmentList) return res.status(404).json({ message: "Bölüm bulunamadı!" })

        res.status(200).json(departmentList)
    } catch (err) {
        res.status(500).json({ message: "Internal server error!" })
        console.log(err)
    }
})

// @route   POST api/bolum/
// @desc    Bölüm ekle
// @access  Private (add-department)
router.post('/', authCheck('add-department'), async (req, res, next) => {
    try {
        await departmentScheme.validateAsync(req.body)

        const department = await Department.unscoped().findOne({ where: { slug: standartSlugify(req.body.name), SchoolId: req.body.SchoolId } })
        if (department) return res.status(400).json({ message: "Bölüm zaten var!" })

        // Bölümü oluştur, bölümü açan kişinin idsini ve bölüm slug'ını özel oluştur
        const newDepartment = await Department.create({ ...req.body, isActivated: 1, UserId: req.authUser.id, slug: standartSlugify(req.body.name) })

        res.status(200).json(newDepartment)
    } catch (err) {
        res.status(500).json({ message: "Internal server error!" })
        console.log(err)
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
        if (!department) return res.status(404).json({ message: "Bölüm bulunamadı!" })

        await department.update({ ...req.body })

        res.status(200).json(department)
    } catch (err) {
        res.status(500).json({ message: "Internal server error!" })
        console.log(err)
    }
})

// @route   DELETE api/bolum/
// @desc    Bölüm sil
// @access  Private (delete-department)
router.delete('/:id', authCheck('delete-department'), async (req, res, next) => {
    const { id } = req.params
    try {
        const department = await Department.unscoped().findByPk(id)
        if (!department) return res.status(404).json({ message: "Bölüm bulunamadı!" })

        await department.destroy()

        res.status(200).json({ message: "Bölüm başarıyla silindi." })
    } catch (err) {
        res.status(500).json({ message: "Internal server error!" })
        console.log(err)
    }
})

module.exports = router