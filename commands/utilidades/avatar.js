const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('🖼️ Mostra o avatar de um usuário')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuário para ver o avatar')),

    async execute(interaction) {
        const usuario = interaction.options.getUser('usuario') || interaction.user;
        const avatarURL = usuario.displayAvatarURL({ dynamic: true, size: 2048 });

        await interaction.reply({
            embeds: [{
                color: parseInt(interaction.client.config.colors.primary.replace('#', ''), 16),
                title: `🖼️ Avatar de ${usuario.tag}`,
                image: { url: avatarURL },
                footer: { text: 'TASD - Todos Aqui São Donos' }
            }]
        });
    }
};