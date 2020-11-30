const express = require('express')
const standartSlugify = require("standard-slugify")
const PDFMerger = require('pdf-merger-js')
const Path = require('path')
const uuidv4 = require('uuid').v4
const { Note, School, Department } = require('../config/sequelize')
const { upload, clearNoteFolder, deleteNoteFolder, createUUID } = require('../helpers/school')
const authCheck = require('../middlewares/authCheck')

const { noteScheme } = require('../validation/note')

const router = express.Router()

// @route   GET api/bolum/
// @desc    Not listesi
// @access  Public
router.get('/admin', authCheck('see-note'), async (req, res, next) => {
    try {
        const noteList = await Note.unscoped().findAll()
        if (!noteList) return res.status(404).json({ message: "Not bulunamadı!" })

        res.status(200).json(noteList)
    } catch (err) {
        res.status(500).json({ message: "Internal server error!" })
        console.log(err)
    }
})

// @route   GET api/bolum/
// @desc    Not listesi
// @access  Public
router.get('/', async (req, res, next) => {
    const { limit } = req.query
    try {
        const noteList = await Note.findAll({ limit: limit <= 50 ? Number(limit) : 50 })
        if (!noteList) return res.status(404).json({ message: "Not bulunamadı!" })

        res.status(200).json(noteList)
    } catch (err) {
        res.status(500).json({ message: "Internal server error!" })
        console.log(err)
    }
})

// @route   GET api/bolum/
// @desc    Not listesi
// @access  Public
router.get('/:note_id', async (req, res, next) => {
    const { note_id } = req.params
    try {
        const noteList = await Note.findByPk(note_id, { include: [School] })
        if (!noteList) return res.status(404).json({ message: "Not bulunamadı!" })

        res.status(200).json(noteList)
    } catch (err) {
        res.status(500).json({ message: "Internal server error!" })
        console.log(err)
    }
})

// @route   POST api/bolum/
// @desc    Not ekle
// @access  Private (add-note)
router.post('/', createUUID(), authCheck('add-note'), async (req, res, next) => {
    upload(req, res, async function (err) {
        if (err) {
            return res.status(500).json({ message: err.message })
        }

        const { DepartmentId, SchoolId, name } = req.body

        try {
            // Birleştirilen dosyanın isminde kullanılması için bir uuid oluştur
            const fileId = uuidv4()
            // Eğer yüklenen dosya yoksa hata ver
            if (!req.files.length) return res.status(404).json({ message: "Not bulunamadı!" })

            // PDF mergerı initialize et
            const merge = new PDFMerger()
            // Gelen bütün dosyaları sıraya al
            req.files.forEach(file => {
                merge.add(file.path)
            })
            // Birleştir
            await merge.save(Path.resolve(req.files[0].destination, `${fileId}.pdf`))
            // Yükleme esnasında oluşturulan not idsini sonra kullanmak için al
            const [note_id] = req.files[0].destination.split("\\").slice(-1)
            // Birleştirilen pdf dışındaki dosyaları not klasöründen sil
            await clearNoteFolder(SchoolId, DepartmentId, note_id, req.files)

            // Notu alınan özel id ile oluştur, notu açan kişinin idsini ve bölüm slug'ını özel oluştur
            const newNote = await Note.create({
                ...req.body,
                id: note_id,
                isActivated: process.env.NODE_ENV === "development" ? 1 : 0,
                UserId: req.authUser.id,
                DepartmentId,
                fileId: fileId
            })

            res.status(200).json(await Note.findByPk(newNote.id, { include: [Department] }))
        } catch (err) {
            res.status(500).json({ message: "Internal server error!" })
            console.log(err)
        }
    })
})

// @route   PUT api/bolum/
// @desc    Not güncelle
// @access  Private (update-note)
router.put('/:note_id', authCheck('update-note'), async (req, res, next) => {
    const { note_id } = req.params
    try {
        await noteScheme.validateAsync(req.body)

        let note = await Note.unscoped().findByPk(note_id)
        if (!note) return res.status(404).json({ message: "Not bulunamadı!" })

        await note.update({ ...req.body })

        res.status(200).json(note)
    } catch (err) {
        res.status(500).json({ message: "Internal server error!" })
        console.log(err)
    }
})

// @route   DELETE api/bolum/
// @desc    Not sil
// @access  Private (delete-note)
router.delete('/:note_id', authCheck('delete-note'), async (req, res, next) => {
    const { note_id } = req.params
    try {
        const note = await Note.unscoped().findByPk(note_id)
        if (!note) return res.status(404).json({ message: "Not bulunamadı!" })

        await deleteNoteFolder(note_id)
        await note.destroy()

        res.status(200).json({ message: "Not başarıyla silindi." })
    } catch (err) {
        res.status(500).json({ message: "Internal server error!" })
        console.log(err)
    }
})

module.exports = router