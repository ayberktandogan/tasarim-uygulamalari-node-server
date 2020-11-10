const express = require('express')
const standartSlugify = require("standard-slugify")
const { School, User } = require('../../../config/sequelize')
const { downloadImage, deleteImage } = require('../helpers/manga')
const authCheck = require('../middlewares/authCheck')
const uuid = require('uuid')
const uuidv4 = uuid.v4

const { schoolScheme } = require('../validation/school')
const axios = require('axios').default

const router = express.Router()

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
        const school_search = await axios.get(`${process.env.UNIV_LIST_API}`, { params: { name: school_name } })

        if (!school_search.data.length) return res.status(404).json({ message: "Okul bulunamadı!" })

        const school_data = school_search.data[0]

        await School.create({ name: school_data.name, country: school_data.country, webpage: school_data.webpage, domain: school_data.domain, UserId, })

        res.status(200).json(newManga)
    } catch (err) {

        next(err)
    }
})

// @route   PUT api/school/
// @desc    Manga güncelle
// @access  Public
router.put('/:id', authCheck('update-school'), async (req, res, next) => {
    const { id } = req.params
    const { cover_art } = req.body
    try {
        await mangaScheme.validateAsync(req.body)

        let manga = await Manga.findByPk(id, { include: Genre })
        if (!manga) throw new Error(["Manga bulunamadı", 404])

        // Link sağlanıp sağlanmadığını kontrol et
        const changeCoverArt = manga.cover_art !== req.body.cover_art

        // Değişmeden önce cover_art id'sini al
        const oldCoverArtId = manga.cover_art
        // Eğer link sağlanmışsa, body'deki cover_art'ı yeni uuid'ye dönüştür
        if (changeCoverArt) req.body.cover_art = uuidv4()

        await manga.update(req.body)

        // Eğer link sağlanmışsa eski resimleri sil ve yenisini indir
        if (changeCoverArt) {
            await deleteImage({ manga_slug: manga.slug, cover_art: oldCoverArtId, contentType: "cover_art" })
            await downloadImage({ image_url: cover_art, contentType: "cover_art", manga_id: id })
        }

        if (!req.body.genres || !req.body.genres.length) await manga.setGenres([])
        else await manga.setGenres(req.body.genres)

        res.status(200).json(await Manga.findByPk(id, { include: Genre }))
    } catch (err) {
        next(err)
    }
})

// TODO DELETE ALL MANGA FOLDERS
// @route   DELETE api/school/
// @desc    Manga sil
// @access  Public
router.delete('/:id', authCheck('delete-school'), async (req, res, next) => {
    const { id } = req.params
    try {
        const manga = await Manga.findByPk(id)
        if (!manga) throw new Error(["Manga bulunamadı", 404])

        await manga.destroy({ force: true })

        res.status(200).json({ message: "Manga başarıyla silindi." })
    } catch (err) {
        next(err)
    }
})

module.exports = router