'use strict';
module.exports = (sequelize, DataTypes) => {
  const School = sequelize.define('School', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: DataTypes.STRING,
    country: DataTypes.STRING,
    webpage: DataTypes.STRING,
    domain: {
      type: DataTypes.STRING,
      unique: true
    },
    cover_art: DataTypes.STRING,
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
    School.hasMany(models.Note)
    School.belongsTo(models.User)
  };
  return School;
};