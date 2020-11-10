'use strict';
module.exports = (sequelize, DataTypes) => {
  const Department = sequelize.define('Department', {
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
  Department.associate = function (models) {
    Department.belongsTo(models.School)
    Department.hasMany(models.Class)
  };
  return Department;
};