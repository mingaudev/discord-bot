const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('🧹 Limpa mensagens do canal')
        .addIntegerOption(option =>
            option.setName('quantidade')
                .setDescription('Quantidade de mensagens (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const quantidade = interaction.options.getInteger('quantidade');

        await interaction.channel.bulkDelete(quantidade, true);

        const reply = await interaction.reply({
            embeds: [{
                color: parseInt(interaction.client.config.colors.success.replace('#', ''), 16),
                description: `🧹 ${quantidade} mensagens foram deletadas!`
            }],
            ephemeral: true,
            fetchReply: true
        });

        setTimeout(() => reply.delete().catch(() => {}), 3000);
    }
};