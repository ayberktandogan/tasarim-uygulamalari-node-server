'use strict';
module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    permission_list: {
      type: DataTypes.JSON,
      allowNull: false
    },
    color: DataTypes.STRING
  }, { paranoid: true });
  Role.associate = function (models) {
    Role.belongsToMany(models.User, { through: models.User_Role })
    Role.belongsTo(models.User, { foreignKey: "createdById" })
  };
  return Role;
};