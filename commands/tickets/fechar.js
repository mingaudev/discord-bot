const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-fechar')
        .setDescription('🔒 Fecha o ticket atual')
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Motivo do fechamento')),

    async execute(interaction) {
        if (!interaction.channel.name.startsWith('ticket-')) {
            return interaction.reply({
                content: '❌ Este comando só funciona em tickets!',
                ephemeral: true
            });
        }

        const motivo = interaction.options.getString('motivo') || 'Sem motivo especificado';

        await interaction.reply({
            embeds: [{
                color: parseInt(interaction.client.config.colors.error.replace('#', ''), 16),
                title: '🔒 Ticket Fechado',
                description: `**Fechado por:** ${interaction.user}\n**Motivo:** ${motivo}`,
                footer: { text: 'O canal será deletado em 5 segundos...' },
                timestamp: new Date()
            }]
        });

        setTimeout(() => {
            interaction.channel.delete();
        }, 5000);
    }
};