const getLootBoxSecond = (sequelize, { DataTypes }) => {
  const LootBoxSecond = sequelize.define('lootboxseconds', {
    rewards: { type: DataTypes.FLOAT },
    xbuff_points: { type: DataTypes.FLOAT },
    createdAt: true,
    updatedAt: 'updateTimestamp'
  });

  return LootBoxSecond;
};

module.exports = getLootBoxSecond;
