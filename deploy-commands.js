const { REST, Routes } = require('discord.js');
const fs = require('fs');

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

// Carregar comandos de arquivos únicos
const singleCommands = ['economia.js', 'ranking.js', 'utilidades.js'];
for (const file of singleCommands) {
    try {
        const command = require(`./commands/${file}`);
        if (command.commands) {
            for (const cmd of command.commands) {
                commands.push(cmd.toJSON());
                console.log(`  ✅ /${cmd.name}`);
            }
        }
    } catch (error) {
        console.log(`  ⚠️ ${file} não encontrado`);
    }
}

// Carregar comandos de pastas
const commandFolders = ['moderacao', 'admin'];
for (const folder of commandFolders) {
    try {
        const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(`./commands/${folder}/${file}`);
            commands.push(command.data.toJSON());
            console.log(`  ✅ ${folder}/${file}`);
        }
    } catch {
        console.log(`  ⚠️ Pasta ${folder} não encontrada`);
    }
}

const rest = new REST({ version: '10' }).setToken(config.token || process.env.BOT_TOKEN);

(async () => {
    try {
        console.log(`\n🔄 Registrando ${commands.length} comandos...`);

        const data = await rest.put(
            Routes.applicationCommands(config.clientId || process.env.CLIENT_ID),
            { body: commands }
        );

        console.log(`✅ ${data.length} comandos registrados com sucesso!`);
    } catch (error) {
        console.error('❌ Erro:', error);
    }
})();