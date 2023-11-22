const getRoundModel = (sequelize, { DataTypes }) => {
  const Round = sequelize.define(
    'rounds',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      startTime: {
        type: DataTypes.DATE
      },
      endTime: {
        type: DataTypes.DATE
      },
      startPrice: {
        type: DataTypes.BIGINT(30),
        defaultValue: 0
      },
      endPrice: {
        type: DataTypes.BIGINT(30),
        defaultValue: 0
      },
      status: {
        type: DataTypes.ENUM('CREATED', 'STARTED', 'ENDED'),
        defaultValue: 'CREATED',
      },
    }, {
    timestamps: true,
    createdAt: true,
    updatedAt: 'updateTimestamp'
  });
  return Round;
};

module.exports = getRoundModel;
