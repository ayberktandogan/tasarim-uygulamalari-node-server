const express = require('express')
const Path = require('path')
const { Note } = require('../config/sequelize')

const router = express.Router()

const authCheck = require('../middlewares/authCheck')

// @route   GET api/kullanici/profil/:slug
// @desc    Kullanıcı profili
// @access  Public
router.get('/notes/:school_domain/:deparment_id/:note_id/:fileId', async (req, res, next) => {
    const { school_domain, deparment_id, note_id, fileId } = req.params
    try {
        const note = await Note.unscoped().findByPk(note_id)
        if (!note) res.status(404).json({ message: "Not bulunamadı!" })
        if (!note.isActivated) res.status(403).json({ message: "Bu nota erişim hakkınız yok!" })

        res.status(200).sendFile(Path.resolve(__dirname, '..', 'storage', 'notes', school_domain, deparment_id, note_id, `${fileId}.pdf`))
    } catch (err) {
        next(err)
    }
})

module.exports = router