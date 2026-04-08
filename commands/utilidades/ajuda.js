const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ajuda')
        .setDescription('❓ Lista todos os comandos do bot'),

    async execute(interaction) {
        await interaction.reply({
            embeds: [{
                color: parseInt(interaction.client.config.colors.primary.replace('#', ''), 16),
                title: '👑 TASD Bot - Comandos',
                description: '**Todos Aqui São Donos**\n\nBot profissional de tickets e moderação.',
                fields: [
                    {
                        name: '🎫 Tickets',
                        value: '`/ticket-setup` - Configura o sistema\n' +
                               '`/ticket-painel` - Envia painel de tickets\n' +
                               '`/ticket-fechar` - Fecha ticket\n' +
                               '`/ticket-add` - Adiciona usuário\n' +
                               '`/ticket-remove` - Remove usuário'
                    },
                    {
                        name: '🛡️ Moderação',
                        value: '`/ban` - Bane usuário\n' +
                               '`/kick` - Expulsa usuário\n' +
                               '`/warn` - Adverte usuário\n' +
                               '`/clear` - Limpa mensagens'
                    },
                    {
                        name: '🔧 Utilidades',
                        value: '`/userinfo` - Info do usuário\n' +
                               '`/serverinfo` - Info do servidor\n' +
                               '`/avatar` - Avatar do usuário\n' +
                               '`/ping` - Latência do bot\n' +
                               '`/ajuda` - Este menu'
                    },
                    {
                        name: '👑 Admin',
                        value: '`/falar` - Faz o bot enviar mensagem'
                    }
                ],
                footer: { text: 'TASD - Sistema Profissional' },
                timestamp: new Date()
            }]
        });
    }
};