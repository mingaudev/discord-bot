const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('🔨 Bane um usuário do servidor')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuário para banir')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Motivo do banimento'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const usuario = interaction.options.getUser('usuario');
        const motivo = interaction.options.getString('motivo') || 'Sem motivo especificado';
        const membro = await interaction.guild.members.fetch(usuario.id);

        if (!membro.bannable) {
            return interaction.reply({
                content: '❌ Não posso banir este usuário!',
                ephemeral: true
            });
        }

        await membro.ban({ reason: motivo });

        await interaction.reply({
            embeds: [{
                color: parseInt(interaction.client.config.colors.error.replace('#', ''), 16),
                title: '🔨 Usuário Banido',
                fields: [
                    { name: 'Usuário', value: `${usuario.tag}`, inline: true },
                    { name: 'Moderador', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Motivo', value: motivo }
                ],
                footer: { text: 'TASD - Sistema de Moderação' },
                timestamp: new Date()
            }]
        });
    }
};