const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const express = require('express');

console.log('🚀 Iniciando TASD Bot...');

// Configuração
let config;
try {
    console.log('📄 Tentando carregar config.json...');
    config = require('./config.json');
    console.log('✅ config.json carregado');
} catch {
    console.log('⚠️ config.json não encontrado, usando variáveis de ambiente');
    config = {
        clientId: process.env.CLIENT_ID,
        token: process.env.BOT_TOKEN
    };
}

if (!config.token && !process.env.BOT_TOKEN) {
    console.error('❌ ERRO: Token não encontrado!');
    process.exit(1);
}

console.log('✅ Credenciais encontradas');

config.colors = {
    primary: "#B91C1C",
    success: "#16A34A",
    error: "#DC2626",
    warning: "#EAB308"
};

console.log('🤖 Criando cliente Discord...');

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

console.log('📂 Carregando comandos...');

// Carregar comandos de arquivos únicos
const singleCommands = ['economia.js', 'ranking.js', 'utilidades.js'];
for (const file of singleCommands) {
    try {
        const command = require(`./commands/${file}`);
        if (command.commands) {
            for (const cmd of command.commands) {
                client.commands.set(cmd.name, {
                    data: cmd,
                    execute: command.execute
                });
                console.log(`  ✅ /${cmd.name}`);
            }
        }
    } catch (error) {
        console.log(`  ⚠️ ${file} não encontrado:`, error.message);
    }
}

// Carregar comandos de pastas
const commandFolders = ['moderacao', 'admin'];
for (const folder of commandFolders) {
    try {
        const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(`./commands/${folder}/${file}`);
            client.commands.set(command.data.name, command);
            console.log(`  ✅ ${folder}/${file}`);
        }
    } catch (error) {
        console.log(`  ⚠️ Pasta ${folder} não encontrada`);
    }
}

console.log(`✅ ${client.commands.size} comandos carregados`);

console.log('📡 Carregando eventos...');

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    try {
        const event = require(`./events/${file}`);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
        console.log(`  ✅ ${file}`);
    } catch (error) {
        console.error(`  ❌ Erro ao carregar ${file}:`, error.message);
    }
}

console.log(`✅ ${eventFiles.length} eventos carregados`);

console.log('🌐 Iniciando servidor web...');

const app = express();

app.get('/', (req, res) => {
    console.log('🔔 Ping recebido do UptimeRobot');
    res.json({
        status: 'online',
        bot: client.user?.tag || 'Carregando...',
        uptime: Math.floor(process.uptime()),
        servers: client.guilds.cache.size,
        users: client.users.cache.size,
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.status(200).send('online');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor web rodando na porta ${PORT}`);
});

console.log('🔐 Fazendo login...');

client.login(config.token || process.env.BOT_TOKEN)
    .then(() => console.log('✅ Login realizado com sucesso!'))
    .catch(error => {
        console.error('❌ Erro ao fazer login:', error);
        process.exit(1);
    });

process.on('unhandledRejection', error => {
    console.error('❌ Erro não tratado:', error);
});