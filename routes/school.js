const express = require('express')
const standartSlugify = require("standard-slugify")
const { School, User } = require('../config/sequelize')
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
        if (!schoolList) throw new Error(["Hiç okul bulunamadı!", 404])

        res.status(200).json(schoolList)
    } catch (err) {
        next(err)
    }
})

// @route   GET api/school/
// @desc    Okul listesi
// @access  Public
router.get('/', async (req, res, next) => {
    try {
        const schoolList = await School.findAll({ include: [User] })
        if (!schoolList) throw new Error(["Hiç okul bulunamadı!", 404])

        res.status(200).json(schoolList)
    } catch (err) {
        next(err)
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

        next(err)
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
        if (!school) throw new Error("Okul bulunamadı")

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
        err.statusCode = 404
        next(err)
    }
})

// @route   DELETE api/school/
// @desc    Okul sil
// @access  Public
router.delete('/:id', authCheck('delete-school'), async (req, res, next) => {
    const { id } = req.params
    try {
        const school = await School.unscoped().findByPk(id)
        if (!school) throw new Error(["Okul bulunamadı", 404])

        await school.destroy({ force: true })

        res.status(200).json({ message: "Okul başarıyla silindi." })
    } catch (err) {
        next(err)
    }
})

module.exports = router