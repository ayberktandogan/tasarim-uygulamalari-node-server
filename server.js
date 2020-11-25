require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const helmet = require('helmet')
const cors = require('cors')
const morgan = require('morgan')
const { sequelize, Role, Department } = require('./config/sequelize')
const standartSlugify = require('standard-slugify')
const routes = require('./routes')

const app = express()

// Express middleware
app.use(function (_, res, next) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin, Accept, Authorization, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers")
    res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, OPTIONS")
    next()
})

// Parse incoming data
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Helmet JS middleware
app.use(helmet({
    contentSecurityPolicy: false
}))

// CORS middleware
app.use(cors())

// Set behind proxy
if (process.env.REVERSE_PROXY) {
    app.set('trust proxy', 1)
}

// Use morgan middleware
app.use(morgan('combined'))


// Define routes
app.use("/", routes)


// To use await, we define an async starter function
async function _initializeServer() {
    try {
        // try connecting database server
        await sequelize.authenticate()
        console.info('✔️ Database bağlantısı başarılı.')
        // sync models with database
        await sequelize.sync()
        // create default role
        await Role.findOrCreate({
            where: { slug: "default" },
            defaults: {
                title: "Kullanıcı",
                slug: "default",
                permission_list: require('./config/default_permission_list')
            }
        })
        await Role.findOrCreate({
            where: { slug: "admin" },
            defaults: {
                title: "Admin",
                slug: "admin",
                permission_list: require('./config/permission_list')
            }
        })
        // if departmens table empty, add default departments
        const deparments = await Department.findAll()
        if (!deparments.length) {
            const tempDepartmentArray = []
            for (const department of require('./config/allowed_departments_list')) {
                tempDepartmentArray.push({ name: department, isActivated: 1, slug: standartSlugify(department) })
            }
            await Department.bulkCreate(tempDepartmentArray)
        }
    } catch (err) {
        return console.error('❌ Database bağlantısı başarısız oldu:', err)
    }

    // Set port and listen it
    app.listen(process.env.PORT, () => {
        console.log(`Listening on ${process.env.PORT}`)
    })
}

_initializeServer()
