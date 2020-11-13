'use strict';
module.exports = (sequelize, DataTypes) => {
  const Note = sequelize.define('Note', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    fileId: DataTypes.UUID,
    isActivated: {
      type: DataTypes.BOOLEAN,
      defaultValue: 0
    }
  }, {
    defaultScope: {
      where: { isActivated: 1 }
    }
  });
  Note.associate = function (models) {
    Note.belongsTo(models.Department)
  };
  return Note;
};