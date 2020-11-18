const express = require('express')
const standartSlugify = require("standard-slugify")
const { Sequelize, School, User, Note, Department } = require('../config/sequelize')
const { downloadImage, deleteImage } = require('../helpers/school')
const authCheck = require('../middlewares/authCheck')
const uuid = require('uuid')
const uuidv4 = uuid.v4

const { schoolScheme, schoolAddScheme } = require('../validation/school')
const axios = require('axios').default

const router = express.Router()

// @route   GET api/school/
// @desc    Okul listesi
// @access  Public
router.get('/admin', authCheck('see-school'), async (req, res, next) => {
    try {
        const schoolList = await School.unscoped().findAll({ include: [User] })
        if (!schoolList) return res.status(404).json({ message: "Okul bulunamadı!" })

        res.status(200).json(schoolList)
    } catch (err) {
        res.status(500).json({ message: "Internal server error!" })
        console.log(err)
    }
})

// @route   GET api/school/school-notes/:school_domain
// @desc    Okulun not listesi
// @access  Public
router.get('/school-notes/:school_domain', async (req, res, next) => {
    const { limit } = req.query
    const { school_domain } = req.params
    try {
        const schoolCheck = await School.findOne({ where: { domain: school_domain } })
        if (!schoolCheck) return res.status(404).json({ message: "Okul bulunamadı!", status: "school-not-found" })

        const noteListFromSchoolDomain = await Note.findAll({
            include: [
                {
                    model: Department,
                    include: {
                        model: School,
                        where: { domain: school_domain }
                    }
                }
            ]
        })

        res.status(200).json({ school: schoolCheck, notes: noteListFromSchoolDomain })
    } catch (err) {
        err.statusCode = 404
        res.status(500).json({ message: "Internal server error!" })
        console.log(err)
    }
})

// @route   GET api/school/
// @desc    Okul listesi
// @access  Public
router.get('/', async (req, res, next) => {
    const { limit } = req.query
    try {
        const schoolList = await School.findAll({ include: [User], limit: limit <= 50 ? Number(limit) : 50 })
        if (!schoolList) return res.status(404).json({ message: "Okul bulunamadı!" })

        res.status(200).json(schoolList)
    } catch (err) {
        res.status(500).json({ message: "Internal server error!" })
        console.log(err)
    }
})

// @route   GET api/school/
// @desc    Okul listesi
// @access  Public
router.get('/:school_id', async (req, res, next) => {
    const { school_id } = req.params
    try {
        const schoolList = await School.findByPk(school_id, { include: [User, Department] })
        if (!schoolList) return res.status(404).json({ message: "Okul bulunamadı!" })

        res.status(200).json(schoolList)
    } catch (err) {
        res.status(500).json({ message: "Internal server error!" })
        console.log(err)
    }
})

// @route   POST api/school/
// @desc    Okul ekle
// @access  Public
router.post('/', authCheck('add-school'), async (req, res, next) => {
    const { school_name } = req.body
    try {
        await schoolAddScheme.validateAsync(req.body)

        const school_search = await axios.get(`${process.env.UNIV_LIST_API}`, { params: { name: school_name } })
        if (school_search.data.length !== 1) return res.status(404).json({ message: "Okul bulunamadı!" })

        const school_data = school_search.data[0]

        const school_exists = await School.unscoped().findOne({ where: { domain: school_data.domains[0] } })
        if (school_exists) return res.status(400).json({ message: "Okul zaten ekli!" })

        const newSchool = await School.create({
            name: school_data.name,
            country: school_data.country,
            webpage: school_data.web_pages[0],
            domain: school_data.domains[0],
            UserId: req.authUser.id,
            isActivated: 1
        })

        res.status(200).json(newSchool)
    } catch (err) {
        res.status(500).json({ message: "Internal server error!" })
        console.log(err)
    }
})

// @route   PUT api/school/
// @desc    Okul güncelle
// @access  Public
router.put('/:id', authCheck('update-school'), async (req, res, next) => {
    const { id } = req.params
    const { cover_art } = req.body
    try {
        await schoolScheme.validateAsync(req.body)

        let school = await School.unscoped().findByPk(id)
        if (!school) return res.status(404).json({ message: "Okul bulunamadı!" })

        // Link sağlanıp sağlanmadığını kontrol et
        const changeCoverArt = school.cover_art !== req.body.cover_art

        // Değişmeden önce cover_art id'sini al
        const oldCoverArtId = school.cover_art
        // Eğer link sağlanmışsa, body'deki cover_art'ı yeni uuid'ye dönüştür
        if (changeCoverArt) req.body.cover_art = uuidv4()

        await school.update(req.body)

        // Eğer link sağlanmışsa eski resimleri sil ve yenisini indir
        if (changeCoverArt) {
            await deleteImage({ school_slug: school.domain, cover_art: oldCoverArtId })
            await downloadImage({ image_url: cover_art, school_id: id })
        }

        res.status(200).json(await School.unscoped().findByPk(id))
    } catch (err) {
        res.status(500).json({ message: "Internal server error!" })
        console.log(err)
    }
})

// @route   DELETE api/school/
// @desc    Okul sil
// @access  Public
router.delete('/:id', authCheck('delete-school'), async (req, res, next) => {
    const { id } = req.params
    try {
        const school = await School.unscoped().findByPk(id)
        if (!school) return res.status(404).json({ message: "Okul bulunamadı!" })

        await school.destroy({ force: true })

        res.status(200).json({ message: "Okul başarıyla silindi." })
    } catch (err) {
        res.status(500).json({ message: "Internal server error!" })
        console.log(err)
    }
})

module.exports = router