const Path = require("path")
const fs = require("fs")
const multer = require("multer")
const axios = require('axios')
const sharp = require('sharp')
const { School, Note, Department } = require('../config/sequelize')
const { downloadImageScheme } = require("../validation/helpers/downloadImage")
const { noteScheme } = require("../validation/note")
const uuidv4 = require('uuid').v4

const note_file_path = `../storage/notes`

function createUUID() {
    return async function (req, res, next) {
        try {
            req.note_id_create = uuidv4()
            next()
        } catch (err) {
            console.log(err)
            res.status(500).json({ message: "Internal server error" })
        }
    }
}

const note_episode_storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const { DepartmentId, SchoolId, name } = req.body

        // Gelen bodyi kontrol et
        const check = noteScheme.validate(req.body)
        if (check.error) return cb(new Error("Gelen data hatalı"))

        // Okul var mı diye kontrol et
        const school = await School.findByPk(SchoolId)
        if (!school) return cb(new Error("Okul bulunamadı!"))

        // Bölüm var mı diye kontrol et
        const departmentCheck = await Department.findByPk(DepartmentId)
        if (!departmentCheck) return cb(new Error("Bölüm bulunamadı!"))

        // Notun yüklenmeye çalışılan bölüme daha önceden aynı isimli bir not açılmış mı diye bak
        const note = await Note.unscoped().findOne({ where: { SchoolId, DepartmentId, name } })
        if (note) return cb(new Error("Bölüm zaten var!"))

        // ./storage/notes/yildiz.edu.tr/2d6235ce-5715-4c37-a408-9411322f3282/1c9efc3e-739f-4c21-be4b-f8c15d4cb082/8321fc3e-44T8-4c21-be4b-f8c15d4cb082.pdf
        const path = Path.resolve(__dirname, note_file_path, school.domain, DepartmentId, req.note_id_create)
        if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true })
        cb(null, path)
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})

const upload = multer({
    storage: note_episode_storage,
    fileFilter: function (req, file, cb) {
        var ext = Path.extname(file.originalname);
        if (ext !== '.pdf') {
            return cb(new Error('Bu menüden sadece "pdf" uzantılı dosyalar ekleyebilirsiniz.'))
        }
        cb(null, true)
    }
}).array('note_files')

async function deleteNoteFolder(note_id) {
    if (!note_id) throw new Error("Parametreler eksik!")

    const note = await Note.findByPk(note_id, { include: [Department, School] })

    const folderPath = Path.resolve(__dirname, note_file_path, note.School.domain, note.Department.id, note.id)

    if (!fs.existsSync(folderPath)) return console.log("Klasör bulunamadı.", folderPath)

    const filepath = Path.resolve(__dirname, note_file_path, note.School.domain, note.Department.id, note.id, `${note.fileId}.pdf`)
    fs.unlinkSync(filepath, (err) => {
        if (err) {
            return unlinkFileError(path, err)
        }
    })

    fs.rmdirSync(folderPath)
}

async function deleteNoteFolders(note_id) {
    if (!note_id) throw "Parametreler eksik."

    const note = Note.findByPk(note_id, { include: [School] })

    const folderPath = Path.resolve(__dirname, note_file_path, note.School.domain)

    if (!fs.existsSync(folderPath)) throw new Error("Klasör bulunamadı.")

    // Varolan not dosyalarını bul
    const existingDepartments = fs.readdirSync(folderPath)
    // Döndür
    for (const department of existingDepartments) {
        // Varolan not dosyaları içerisindeki dosyaları bul 
        const existingFile = fs.readdirSync(Path.resolve(folderPath, department, note_id))
        if (!existingFile) return
        const filepath = Path.resolve(folderPath, department, note_id, `${fileId}.pdf`)
        fs.unlinkSync(filepath, (err) => {
            if (err) {
                return unlinkFileError(path, err)
            }
        })
        // Not dosyasını sil
        fs.rmdirSync(Path.resolve(folderPath, department, note_id))
    }
    // Not dosyasını sil
    fs.rmdirSync(folderPath)
}

async function clearNoteFolder(school_id, department_id, note_id, notes) {
    const school = await School.findByPk(school_id)

    const existingFolder = Path.resolve(__dirname, note_file_path, school.domain, department_id, note_id)
    if (!fs.existsSync(existingFolder)) return

    for (const note of notes) {
        const notePath = Path.resolve(existingFolder, note.filename)
        fs.unlinkSync(notePath, (err) => {
            if (err) {
                return unlinkFileError(path, err)
            }
        })
    }
}

const schoolFolderPathGenerator = ({ school_slug }) => Path.resolve(__dirname, "..", "storage", "images", "school", school_slug)
const xsmallImagePathGenerator = ({ schoolFolderPath, foldername }) => Path.resolve(schoolFolderPath, `${foldername}.64.png`)
const smallImagePathGenerator = ({ schoolFolderPath, foldername }) => Path.resolve(schoolFolderPath, `${foldername}.128.png`)
const mediumImagePathGenerator = ({ schoolFolderPath, foldername }) => Path.resolve(schoolFolderPath, `${foldername}.256.png`)
const originalImagePathGenerator = ({ schoolFolderPath, foldername }) => Path.resolve(schoolFolderPath, `${foldername}.512.png`)

async function saveCoverArt({ imageData, school_slug, foldername }) {
    const schoolFolderPath = schoolFolderPathGenerator({ school_slug })
    if (!fs.existsSync(schoolFolderPath)) fs.mkdirSync(schoolFolderPath, { recursive: true })

    const xsmallImagePath = xsmallImagePathGenerator({ schoolFolderPath, foldername })
    const smallImagePath = smallImagePathGenerator({ schoolFolderPath, foldername })
    const mediumImagePath = mediumImagePathGenerator({ schoolFolderPath, foldername })
    const originalImagePath = originalImagePathGenerator({ schoolFolderPath, foldername })

    try {
        const xsmallWriter = fs.createWriteStream(xsmallImagePath, { flags: 'w' })
        const smallWriter = fs.createWriteStream(smallImagePath, { flags: 'w' })
        const mediumWriter = fs.createWriteStream(mediumImagePath, { flags: 'w' })
        const originalWriter = fs.createWriteStream(originalImagePath, { flags: 'w' })
        try {
            imageData.pipe(sharp().resize({ width: 64 })).png().pipe(xsmallWriter)
            imageData.pipe(sharp().resize({ width: 128 })).png().pipe(smallWriter)
            imageData.pipe(sharp().resize({ width: 256 })).png().pipe(mediumWriter)
            imageData.pipe(sharp().resize({ width: 512 })).png().pipe(originalWriter)
        } catch (err) {
            console.log(err)
            [xsmallImagePath, smallImagePath, mediumImagePath, originalImagePath].map(path => {
                if (fs.existsSync(path))
                    fs.unlink(path, (err) => {
                        if (err) {
                            return console.log(path, err)
                        }
                        console.log(path)
                        return true
                    })
            })
            throw new Error(err)
        }
    } catch (err) {
        console.log(err)
        throw new Error(err)
    }
}

async function downloadImage({ image_url, school_id }) {
    try {
        await downloadImageScheme.validateAsync({ image_url, school_id })

        let imageData = undefined

        try {
            imageData = await axios.get(image_url, { responseType: "stream" })
        } catch (err) {
            throw new Error(err)
        }

        const school = await School.unscoped().findByPk(school_id)
        if (!school) throw new Error("Okul bulunamadı!")

        await saveCoverArt({ imageData: imageData.data, school_slug: school.domain, foldername: school.cover_art })

        console.log(`${school.name} cover_art'ları başarıyla indirildi.`)
    } catch (err) {
        err.statusCode = 404
        throw new Error(err)
    }
}

async function deleteCoverArt({ school_slug, cover_art }) {
    const schoolFolderPath = schoolFolderPathGenerator({ school_slug })

    const fileList = [
        xsmallImagePathGenerator({ schoolFolderPath, foldername: cover_art }),
        smallImagePathGenerator({ schoolFolderPath, foldername: cover_art }),
        mediumImagePathGenerator({ schoolFolderPath, foldername: cover_art }),
        originalImagePathGenerator({ schoolFolderPath, foldername: cover_art })
    ]
    fileList.map(file => {
        fs.unlink(file, (err) => {
            if (err) console.log(file, err)

            return console.log(`${file} silindi.`)
        })
    })
}

async function deleteImage({ school_slug, cover_art }) {
    await deleteCoverArt({ school_slug, cover_art })
}

module.exports = { createUUID, upload, deleteNoteFolder, deleteNoteFolders, downloadImage, deleteImage, clearNoteFolder, note_file_path }