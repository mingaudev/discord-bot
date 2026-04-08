const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-setup')
        .setDescription('👑 Configura o sistema de tickets')
        .addChannelOption(option =>
            option.setName('categoria')
                .setDescription('Categoria onde os tickets serão criados')
                .addChannelTypes(ChannelType.GuildCategory)
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('cargo-staff')
                .setDescription('Cargo que terá acesso aos tickets')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const categoria = interaction.options.getChannel('categoria');
        const cargoStaff = interaction.options.getRole('cargo-staff');

        const dbPath = './database/tickets.json';
        let db = {};

        if (fs.existsSync(dbPath)) {
            db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        }

        db[interaction.guild.id] = {
            categoria: categoria.id,
            cargoStaff: cargoStaff.id,
            ticketCounter: 0
        };

        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        await interaction.reply({
            embeds: [{
                color: parseInt(interaction.client.config.colors.success.replace('#', ''), 16),
                title: '✅ Sistema de Tickets Configurado',
                description: `**Categoria:** ${categoria}\n**Cargo Staff:** ${cargoStaff}`,
                footer: { text: 'TASD - Todos Aqui São Donos' },
                timestamp: new Date()
            }],
            ephemeral: true
        });
    }
};