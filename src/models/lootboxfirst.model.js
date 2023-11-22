const getLootBoxFirst = (sequelize, { DataTypes }) => {
  const LootBoxFirst = sequelize.define('lootboxfirsts', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    rewards: { type: DataTypes.FLOAT },
    xbuff_points: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
  }, {
    timestamps: true,
    createdAt: true,
    updatedAt: 'updateTimestamp'
  });

  return LootBoxFirst;
};

module.exports = getLootBoxFirst;
