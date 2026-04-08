const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const express = require('express');

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

// Cores e emojis
config.colors = {
    primary: "#B91C1C",
    success: "#16A34A",
    error: "#DC2626",
    warning: "#EAB308"
};

config.emojis = {
    ticket: "🎫",
    close: "🔒",
    success: "✅",
    error: "❌",
    crown: "👑",
    moderation: "🛡️"
};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();
client.config = config;

// Carregar comandos
const commandFolders = fs.readdirSync('./commands');
for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./commands/${folder}/${file}`);
        client.commands.set(command.data.name, command);
    }
}

// Carregar eventos
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// Servidor web para UptimeRobot
const app = express();

app.get('/', (req, res) => {
    res.json({
        status: 'online',
        bot: client.user?.tag || 'Carregando...',
        uptime: process.uptime(),
        servers: client.guilds.cache.size
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 Servidor rodando na porta ${PORT}`);
});

// Login
client.login(config.token || process.env.BOT_TOKEN);