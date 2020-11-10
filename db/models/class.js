'use strict';
module.exports = (sequelize, DataTypes) => {
  const Class = sequelize.define('Class', {
    name: DataTypes.STRING,
    isActivated: {
      type: DataTypes.BOOLEAN,
      defaultValue: 0
    }
  }, {
    defaultScope: {
      where: { isActivated: 1 }
    }
  });
  Class.associate = function (models) {
    Class.belongsTo(models.Department)
    Class.hasMany(models.Note)
  };
  return Class;
};