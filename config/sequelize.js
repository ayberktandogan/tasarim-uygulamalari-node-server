const Sequelize = require('sequelize');
var fs = require("fs");
var path = require("path");

const { database, username, password } = require('../db/config/config')[process.env.NODE_ENV]

// Option 1: Passing parameters separately
const sequelize = new Sequelize(database, username, password, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mariadb',
    dialectOptions: {
        timezone: 'Etc/GMT+3',
    },
    logging: process.env.NODE_ENV === "production" ? false : (msg) => {
        console.log(" ")
        console.info("\x1b[36m############\x1b[33mSEQUELIZE QUERY\x1b[36m############")
        console.info(msg)
        console.info("\x1b[36m#########\x1b[33mEND OFSEQUELIZE QUERY\x1b[36m#########")
        console.log(" ")
    },
    pool: {
        max: Number(process.env.DB_CONNECTION_MAX),
        min: Number(process.env.DB_CONNECTION_MIN),
        acquire: 30000,
        idle: 10000
    }
})
const db = {}

fs
    .readdirSync(path.join(__dirname, '../', 'db', 'models'))
    .filter(function (file) {
        return (file.indexOf(".") !== 0) && (file !== "index.js");
    })
    .forEach(function (file) {
        var model = require(path.join(__dirname, '../', 'db', 'models', file))(sequelize, Sequelize);
        db[model.name] = model;
    });

Object.keys(db).forEach(function (modelName) {
    if ("associate" in db[modelName]) {
        db[modelName].associate(db);
    }
});

db.Sequelize = Sequelize
db.sequelize = sequelize

module.exports = db