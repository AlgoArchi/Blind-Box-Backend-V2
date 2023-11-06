const getLootBoxFirst = (sequelize, { DataTypes }) => {
  const LootBoxFirst = sequelize.define('lootboxfirsts', {
    rewards: { type: DataTypes.FLOAT },
    xbuff_points: { type: DataTypes.FLOAT },
    createdAt: true,
    updatedAt: 'updateTimestamp'
  });

  return LootBoxFirst;
};

module.exports = getLootBoxFirst;
