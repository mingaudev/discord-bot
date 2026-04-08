const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('falar')
        .setDescription('👑 Faz o bot enviar uma mensagem')
        .addStringOption(option =>
            option.setName('mensagem')
                .setDescription('Mensagem que o bot irá enviar')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('canal')
                .setDescription('Canal onde a mensagem será enviada (padrão: atual)'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const mensagem = interaction.options.getString('mensagem');
        const canal = interaction.options.getChannel('canal') || interaction.channel;

        await canal.send(mensagem);

        await interaction.reply({
            embeds: [{
                color: parseInt(interaction.client.config.colors.success.replace('#', ''), 16),
                description: `✅ Mensagem enviada em ${canal}!`
            }],
            ephemeral: true
        });
    }
};