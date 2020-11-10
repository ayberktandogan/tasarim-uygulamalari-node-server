'use strict';
module.exports = (sequelize, DataTypes) => {
  const Note = sequelize.define('Note', {
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
    Note.belongsTo(models.Class)
  };
  return Note;
};