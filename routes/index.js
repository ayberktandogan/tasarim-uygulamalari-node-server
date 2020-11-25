const express = require('express')
const router = express()

// Define routes
const authRoutes = require('./auth')
const roleRoutes = require('./role')
const userRoleRoutes = require('./user_role')
const schoolRoutes = require('./school')
const departmentRoutes = require('./department')
const noteRoutes = require('./note')
const proxyRoutes = require('./proxy')
const userRoutes = require('./user')
const storageRoutes = require('./storage')

// Use Routes
router.use('/api/v1/auth', authRoutes)
router.use('/api/v1/role', roleRoutes)
router.use('/api/v1/userRole', userRoleRoutes)
router.use('/api/v1/school', schoolRoutes)
router.use('/api/v1/department', departmentRoutes)
router.use('/api/v1/note', noteRoutes)
router.use('/api/v1/proxy', proxyRoutes)
router.use('/api/v1/user', userRoutes)
router.use('/storage', storageRoutes)

//
router.use('/*', (_, res) => {
    res.status(404).json({ message: "Aradığınız yol burada değil." })
});

module.exports = router