const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        const canalBoas = member.guild.channels.cache.find(c => c.name === 'boas-vindas');

        if (canalBoas) {
            await canalBoas.send({
                embeds: [{
                    color: 0xB91C1C,
                    title: '👑 Bem-vindo ao TASD!',
                    description: `${member}, seja bem-vindo ao **Todos Aqui São Donos**!\n\n` +
                                 `Você é o membro **#${member.guild.memberCount}**\n\n` +
                                 `Leia as regras e divirta-se!`,
                    thumbnail: { url: member.user.displayAvatarURL({ dynamic: true }) },
                    footer: { text: 'TASD - Todos Aqui São Donos' },
                    timestamp: new Date()
                }]
            });
        }
    }
};