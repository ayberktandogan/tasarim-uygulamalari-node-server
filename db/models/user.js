'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false
    },
    isActivated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    paranoid: true,
    defaultScope: {
      attributes: { exclude: ['password', 'createdAt', 'updatedAt', 'deletedAt'] },
    }
  });
  User.associate = function (models) {
    User.hasMany(models.School)
    User.hasMany(models.Department)
    User.hasMany(models.Note)
    User.belongsToMany(models.Role, { through: models.User_Role })
  };
  return User;
};