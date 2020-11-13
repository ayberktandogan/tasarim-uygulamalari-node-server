require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const helmet = require('helmet')
const cors = require('cors')
const morgan = require('morgan')
const { sequelize } = require('./config/sequelize')

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
const authRoutes = require('./routes/auth')
const roleRoutes = require('./routes/role')
const userRoleRoutes = require('./routes/user_role')
const schoolRoutes = require('./routes/school')
const departmentRoutes = require('./routes/department')
// Use Routes
app.use('/api/auth', authRoutes)
app.use('/api/role', roleRoutes)
app.use('/api/userRole', userRoleRoutes)
app.use('/api/school', schoolRoutes)
app.use('/api/department', departmentRoutes)

// To use await, we define an async starter function
async function _initializeServer() {
    try {
        await sequelize.authenticate()
        console.info('✔️ Database bağlantısı başarılı.')
        sequelize.sync()
    } catch (err) {
        return console.error('❌ Database bağlantısı başarısız oldu:', err)
    }

    // Set port and listen it
    app.listen(process.env.PORT, () => {
        console.log(`Listening on ${process.env.PORT}`)
    })
}

_initializeServer()
