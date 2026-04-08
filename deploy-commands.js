const { REST, Routes } = require('discord.js');
const fs = require('fs');

// Configuração - usa variáveis de ambiente OU config.json local
let config;
try {
    config = require('./config.json');
} catch {
    config = {
        clientId: process.env.CLIENT_ID,
        token: process.env.BOT_TOKEN
    };
}

const commands = [];
const commandFolders = fs.readdirSync('./commands');

for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./commands/${folder}/${file}`);
        commands.push(command.data.toJSON());
    }
}

const rest = new REST({ version: '10' }).setToken(config.token || process.env.BOT_TOKEN);

(async () => {
    try {
        console.log(`🔄 Registrando ${commands.length} comandos...`);

        const data = await rest.put(
            Routes.applicationCommands(config.clientId || process.env.CLIENT_ID),
            { body: commands }
        );

        console.log(`✅ ${data.length} comandos registrados com sucesso!`);
    } catch (error) {
        console.error('❌ Erro ao registrar comandos:', error);
    }
})();