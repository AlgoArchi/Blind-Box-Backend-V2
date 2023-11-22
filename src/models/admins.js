const Round = require("./rounds");

const getAdminModel = (sequelize, { DataTypes }) => {
    const Admin = sequelize.define(
        'admins',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            roundId: {
                type: DataTypes.INTEGER
            },
            rewardAmount: {
                type: DataTypes.FLOAT
            },
        }, {
        timestamps: true,
        createdAt: true,
        updatedAt: 'updateTimestamp'
    });

    Admin.associate = () => {
        Admin.belongsTo(Round, {
            foreignKey: 'roundId',
        });
    };

    return Admin;
};

module.exports = getAdminModel;
