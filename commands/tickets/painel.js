const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-painel')
        .setDescription('👑 Envia o painel de abertura de tickets')
        .addChannelOption(option =>
            option.setName('canal')
                .setDescription('Canal onde o painel será enviado')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const canal = interaction.options.getChannel('canal');

        const embed = {
            color: parseInt(interaction.client.config.colors.primary.replace('#', ''), 16),
            title: '🎫 Sistema de Tickets - TASD',
            description: '**Todos Aqui São Donos**\n\n' +
                         'Clique no botão abaixo para abrir um ticket e falar com nossa equipe.\n\n' +
                         '**Quando usar:**\n' +
                         '• Suporte geral\n' +
                         '• Reportar problemas\n' +
                         '• Dúvidas sobre o servidor\n' +
                         '• Parcerias\n\n' +
                         '*Tickets abertos sem motivo serão fechados.*',
            thumbnail: { url: interaction.guild.iconURL() },
            footer: { text: 'TASD - Sistema Profissional de Tickets' },
            timestamp: new Date()
        };

        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('abrir_ticket')
                    .setLabel('Abrir Ticket')
                    .setEmoji('🎫')
                    .setStyle(ButtonStyle.Danger)
            );

        await canal.send({ embeds: [embed], components: [button] });

        await interaction.reply({
            content: `✅ Painel enviado em ${canal}`,
            ephemeral: true
        });
    }
};