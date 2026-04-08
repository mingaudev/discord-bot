const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('📊 Mostra informações do servidor'),

    async execute(interaction) {
        const guild = interaction.guild;

        await interaction.reply({
            embeds: [{
                color: parseInt(interaction.client.config.colors.primary.replace('#', ''), 16),
                title: `👑 ${guild.name}`,
                thumbnail: { url: guild.iconURL({ dynamic: true, size: 256 }) },
                fields: [
                    { name: 'ID', value: guild.id, inline: true },
                    { name: 'Dono', value: `<@${guild.ownerId}>`, inline: true },
                    { name: 'Membros', value: `${guild.memberCount}`, inline: true },
                    { name: 'Canais', value: `${guild.channels.cache.size}`, inline: true },
                    { name: 'Cargos', value: `${guild.roles.cache.size}`, inline: true },
                    { name: 'Criado em', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>` }
                ],
                footer: { text: 'TASD - Todos Aqui São Donos' },
                timestamp: new Date()
            }]
        });
    }
};