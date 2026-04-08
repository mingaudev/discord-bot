const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-remove')
        .setDescription('➖ Remove um usuário do ticket')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuário para remover')
                .setRequired(true)),

    async execute(interaction) {
        if (!interaction.channel.name.startsWith('ticket-')) {
            return interaction.reply({
                content: '❌ Este comando só funciona em tickets!',
                ephemeral: true
            });
        }

        const usuario = interaction.options.getUser('usuario');

        await interaction.channel.permissionOverwrites.delete(usuario);

        await interaction.reply({
            embeds: [{
                color: parseInt(interaction.client.config.colors.warning.replace('#', ''), 16),
                description: `⚠️ ${usuario} foi removido do ticket!`
            }]
        });
    }
};