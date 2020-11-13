'use strict';
module.exports = (sequelize, DataTypes) => {
  const User_Role = sequelize.define('User_Role', {
  }, { timestamps: false })
  return User_Role;
};