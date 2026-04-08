const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('👢 Expulsa um usuário do servidor')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuário para expulsar')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Motivo da expulsão'))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        const usuario = interaction.options.getUser('usuario');
        const motivo = interaction.options.getString('motivo') || 'Sem motivo especificado';
        const membro = await interaction.guild.members.fetch(usuario.id);

        if (!membro.kickable) {
            return interaction.reply({
                content: '❌ Não posso expulsar este usuário!',
                ephemeral: true
            });
        }

        await membro.kick(motivo);

        await interaction.reply({
            embeds: [{
                color: parseInt(interaction.client.config.colors.warning.replace('#', ''), 16),
                title: '👢 Usuário Expulso',
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