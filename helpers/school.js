const Path = require("path")
const fs = require("fs")
const multer = require("multer")
const axios = require('axios')
const sharp = require('sharp')
const { School } = require('../config/sequelize')
const { downloadImageScheme } = require("../validation/helpers/downloadImage")

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

module.exports = { downloadImage, deleteImage }