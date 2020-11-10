'use strict';
module.exports = (sequelize, DataTypes) => {
  const Pending_User = sequelize.define('Pending_User', {
    hash: DataTypes.STRING
  }, {
    timestamps: true,
    updatedAt: false
  });
  Pending_User.associate = function (models) {
    Pending_User.belongsTo(models.User)
  };
  return Pending_User;
};