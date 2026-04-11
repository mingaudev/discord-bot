const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('👤 Mostra informações de um usuário')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuário para ver informações')),

    async execute(interaction) {
        const usuario = interaction.options.getUser('usuario') || interaction.user;
        const membro = await interaction.guild.members.fetch(usuario.id);

        const cargos = membro.roles.cache
            .filter(role => role.id !== interaction.guild.id)
            .map(role => role)
            .join(', ') || 'Nenhum';

        await interaction.reply({
            embeds: [{
                color: parseInt(interaction.client.config.colors.primary.replace('#', ''), 16),
                title: `👤 Informações de ${usuario.tag}`,
                thumbnail: { url: usuario.displayAvatarURL({ dynamic: true, size: 256 }) },
                fields: [
                    { name: 'ID', value: usuario.id },
                    { name: 'Entrou em', value: `<t:${Math.floor(membro.joinedTimestamp / 1000)}:F>` },
                    { name: 'Conta criada em', value: `<t:${Math.floor(usuario.createdTimestamp / 1000)}:F>` },
                    { name: `Cargos [${membro.roles.cache.size - 1}]`, value: cargos }
                ],
                footer: { text: 'TASD - Todos Aqui São Donos' },
                timestamp: new Date()//a
            }]
        });
    }
};