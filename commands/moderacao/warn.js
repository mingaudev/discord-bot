const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('⚠️ Adverte um usuário')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuário para advertir')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Motivo da advertência')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const usuario = interaction.options.getUser('usuario');
        const motivo = interaction.options.getString('motivo');

        const dbPath = './database/tickets.json';
        let db = {};

        if (fs.existsSync(dbPath)) {
            db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        }

        if (!db.warns) db.warns = {};
        if (!db.warns[usuario.id]) db.warns[usuario.id] = [];

        db.warns[usuario.id].push({
            moderador: interaction.user.tag,
            motivo: motivo,
            data: new Date().toISOString()
        });

        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        await interaction.reply({
            embeds: [{
                color: parseInt(interaction.client.config.colors.warning.replace('#', ''), 16),
                title: '⚠️ Advertência Aplicada',
                fields: [
                    { name: 'Usuário', value: `${usuario.tag}`, inline: true },
                    { name: 'Moderador', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Motivo', value: motivo },
                    { name: 'Total de Warns', value: `${db.warns[usuario.id].length}` }
                ],
                footer: { text: 'TASD - Sistema de Moderação' },
                timestamp: new Date()
            }]
        });
    }
};