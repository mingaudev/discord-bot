const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-add')
        .setDescription('➕ Adiciona um usuário ao ticket')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuário para adicionar')
                .setRequired(true)),

    async execute(interaction) {
        if (!interaction.channel.name.startsWith('ticket-')) {
            return interaction.reply({
                content: '❌ Este comando só funciona em tickets!',
                ephemeral: true
            });
        }

        const usuario = interaction.options.getUser('usuario');

        await interaction.channel.permissionOverwrites.create(usuario, {
            ViewChannel: true,
            SendMessages: true
        });

        await interaction.reply({
            embeds: [{
                color: parseInt(interaction.client.config.colors.success.replace('#', ''), 16),
                description: `✅ ${usuario} foi adicionado ao ticket!`
            }]
        });
    }
};