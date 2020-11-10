'use strict';
module.exports = (sequelize, DataTypes) => {
  const School = sequelize.define('School', {
    name: DataTypes.STRING,
    country: DataTypes.STRING,
    webpage: DataTypes.STRING,
    domain: {
      type: DataTypes.STRING,
      unique: true
    },
    coverArt: DataTypes.STRING,
    isActivated: {
      type: DataTypes.BOOLEAN,
      defaultValue: 0
    }
  }, {
    defaultScope: {
      where: { isActivated: 1 }
    }
  });
  School.associate = function (models) {
    School.hasMany(models.Department)
  };
  return School;
};