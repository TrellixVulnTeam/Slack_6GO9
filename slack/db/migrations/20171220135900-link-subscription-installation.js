module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Subscriptions', 'installationId', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: 'Installations',
        key: 'id',
      },
      onDelete: 'cascade',
      hooks: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Subscriptions', 'installationId');
  },
};
