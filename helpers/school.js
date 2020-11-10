const Path = require("path")
const fs = require("fs")
const multer = require("multer")
const axios = require('axios')
const sharp = require('sharp')
const { School } = require('../config/sequelize')
const { downloadImageScheme } = require("../validation/helpers/downloadImage")

const schoolFolderPathGenerator = ({ school_slug }) => Path.resolve(__dirname, "..", "images", "school", school_slug)
const xsmallImagePathGenerator = ({ schoolFolderPath, foldername }) => Path.resolve(schoolFolderPath, `${foldername}.64.jpeg`)
const smallImagePathGenerator = ({ schoolFolderPath, foldername }) => Path.resolve(schoolFolderPath, `${foldername}.128.jpeg`)
const mediumImagePathGenerator = ({ schoolFolderPath, foldername }) => Path.resolve(schoolFolderPath, `${foldername}.256.jpeg`)
const originalImagePathGenerator = ({ schoolFolderPath, foldername }) => Path.resolve(schoolFolderPath, `${foldername}.jpeg`)

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
            imageData.pipe(sharp().resize({ width: 64 })).jpeg({ quality: 90 }).pipe(xsmallWriter)
            imageData.pipe(sharp().resize({ width: 128 })).jpeg({ quality: 90 }).pipe(smallWriter)
            imageData.pipe(sharp().resize({ width: 256 })).jpeg({ quality: 90 }).pipe(mediumWriter)
            imageData.pipe(sharp().jpeg({ quality: 90 }).pipe(originalWriter))
        } catch (err) {
            console.log(err)
            [smallImagePath, mediumImagePath, originalImagePath].map(path => {
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

async function downloadImage({ image_url, school_id, contentType }) {
    try {
        await downloadImageScheme.validateAsync({ image_url, school_id, contentType })

        let imageData = undefined

        try {
            imageData = await axios.get(image_url, { responseType: "stream" })
        } catch (err) {
            throw new Error(err)
        }

        const school = await School.findByPk(school_id)
        if (!school) throw new Error(["School bulunamadı.", 404])

        switch (contentType) {
            case "cover_art": {
                await saveCoverArt({ imageData: imageData.data, school_slug: school.slug, foldername: school.cover_art })
                break
            }
            case "header_image": {
                //
                break
            }
            default: {
                throw new Error("contentType belirtilmemiş!")
            }
        }

        console.log(`${school.title} cover_art'ları başarıyla indirildi.`)
    } catch (err) {
        console.log(err)
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

async function deleteImage({ school_slug, cover_art, contentType }) {
    switch (contentType) {
        case "cover_art": {
            await deleteCoverArt({ school_slug, cover_art })
        }
        default: {
            throw new Error("contentType belirtilmemiş!")
        }
    }
}

module.exports = { upload, downloadImage, deleteImage }