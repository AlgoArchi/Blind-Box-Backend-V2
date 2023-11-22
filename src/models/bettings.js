const User = require("./users");
const Round = require("./rounds");

const getBettingModel = (sequelize, { DataTypes }) => {
    const Betting = sequelize.define(
        'bettings',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            user_id: {
                type: DataTypes.INTEGER
            },
            wallet_address: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            roundId: {
                type: DataTypes.INTEGER
            },
            betAmount: {
                type: DataTypes.FLOAT
            },
            prediction: {
                type: DataTypes.ENUM('UP', 'DOWN'),
            },
            status: {
                type: DataTypes.ENUM('PENDING', 'LOST', 'WIN', 'DRAW'),
                defaultValue: 'PENDING',
            },
            prize: {
                type: DataTypes.FLOAT,
                defaultValue: 0
            }
        }, {
        timestamps: true,
        createdAt: true,
        updatedAt: 'updateTimestamp'
    });

    Betting.associate = () => {
        Betting.belongsTo(User, {
            foreignKey: 'user_id',
        });
    };
    Betting.associate = () => {
        Betting.belongsTo(Round, {
            foreignKey: 'roundId',
        });
    };

    return Betting;
};

module.exports = getBettingModel;
