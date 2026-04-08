const { Events, ActivityType } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`✅ Bot online como ${client.user.tag}`);
        console.log(`👑 Servindo ${client.guilds.cache.size} servidor(es)`);
        console.log(`👤 ${client.users.cache.size} usuários`);

        client.user.setPresence({
            activities: [{
                name: 'TASD - Todos Aqui São Donos',
                type: ActivityType.Watching
            }],
            status: 'online'
        });
    }
};