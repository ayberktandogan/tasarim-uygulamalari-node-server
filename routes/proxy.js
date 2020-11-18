const express = require('express')

const router = express.Router()

// @route   GET api/proxy/
// @desc    Not listesi
// @access  Public
router.get('/school_list', async (req, res, next) => {
    return res.status(200).json(require('../config/world_universities_and_domains.json'))
})

module.exports = router