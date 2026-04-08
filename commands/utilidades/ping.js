const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('🏓 Mostra a latência do bot'),

    async execute(interaction) {
        const sent = await interaction.reply({
            embeds: [{
                color: parseInt(interaction.client.config.colors.primary.replace('#', ''), 16),
                description: '🏓 Calculando latência...'
            }],
            fetchReply: true
        });

        const latencia = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatencia = Math.round(interaction.client.ws.ping);

        await interaction.editReply({
            embeds: [{
                color: parseInt(interaction.client.config.colors.primary.replace('#', ''), 16),
                title: '🏓 Pong!',
                fields: [
                    { name: 'Latência', value: `${latencia}ms`, inline: true },
                    { name: 'API', value: `${apiLatencia}ms`, inline: true }
                ],
                footer: { text: 'TASD - Todos Aqui São Donos' },
                timestamp: new Date()
            }]
        });
    }
};