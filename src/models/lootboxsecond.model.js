const getLootBoxSecond = (sequelize, { DataTypes }) => {
  const LootBoxSecond = sequelize.define('lootboxseconds', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    rewards: { type: DataTypes.FLOAT },
    xbuff_points: { type: DataTypes.FLOAT },
  }, {
    timestamps: true,
    createdAt: true,
    updatedAt: 'updateTimestamp'
  });

  return LootBoxSecond;
};

module.exports = getLootBoxSecond;
