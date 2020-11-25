const Joi = require('joi')
const jwt = require('jsonwebtoken')
const permission_list = require('../config/permission_list')
const _ = require('lodash')

const authCheckSchema = Joi.object({
    token: Joi.string().regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/).required()
})

const { Role, User } = require('../config/sequelize')

module.exports = function (permission) {
    return async function (req, res, next) {
        try {
            // Token'i headerdan al
            let token = req.headers['x-access-token'] || req.headers['authorization']
            // Token yoksa hata ver
            if (!token) return res.status(403).json({ message: "Lütfen sisteme giriş yapın." })
            // Tokenden "Bearer " bölümünü sil, tokeni al
            token = token.slice(7, token.length).trimLeft()
            // Gelen body'i kontrol et
            await authCheckSchema.validateAsync({ token })
            // Token'i kontrol et
            const validatedUser = await jwt.verify(token, process.env.LOG_SECRET_KEY)
            // Token içerisindeki id'ye göre kullanıcının rollerini bul
            const UserAuthPerms = await User.findByPk(validatedUser.user_id, { include: [Role] })
            if (!UserAuthPerms) throw new Error("")
            // merge all permission nodes
            let roles = []
            for (const role of UserAuthPerms.Roles) {
                roles = [...roles, ...JSON.parse(role.permission_list)]
            }
            // find required permission from merged permission list
            const isPermitted = _.find(roles, function (r) { return r === permission })
            if (!isPermitted) throw new Error("")
            // Bulunan kullanıcıyı yolla
            req.authUser = UserAuthPerms
            next()
        } catch (err) {
            return res.status(403).json({ message: "Bu işlemi gerçekleştirmek için yetkiniz yok!" })
        }
    }
}