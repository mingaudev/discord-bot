const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const express = require('express');

console.log('🚀 Iniciando TASD Bot...');

// Configuração - usa variáveis de ambiente OU config.json local
let config;
try {
    console.log('📄 Tentando carregar config.json...');
    config = require('./config.json');
    console.log('✅ config.json carregado com sucesso');
} catch (error) {
    console.log('⚠️ config.json não encontrado, usando variáveis de ambiente');
    config = {
        clientId: process.env.CLIENT_ID,
        token: process.env.BOT_TOKEN
    };
}

// Verificar se as credenciais existem
if (!config.token && !process.env.BOT_TOKEN) {
    console.error('❌ ERRO: Token do bot não encontrado!');
    console.error('Configure a variável BOT_TOKEN no Render');
    process.exit(1);
}

if (!config.clientId && !process.env.CLIENT_ID) {
    console.error('❌ ERRO: Client ID não encontrado!');
    console.error('Configure a variável CLIENT_ID no Render');
    process.exit(1);
}

console.log('✅ Credenciais encontradas');

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

// Carregar comandos
try {
    const commandFolders = fs.readdirSync('./commands');
    let totalComandos = 0;
    
    for (const folder of commandFolders) {
        const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            try {
                const command = require(`./commands/${folder}/${file}`);
                client.commands.set(command.data.name, command);
                totalComandos++;
                console.log(`  ✅ ${folder}/${file}`);
            } catch (error) {
                console.error(`  ❌ Erro ao carregar ${folder}/${file}:`, error.message);
            }
        }
    }
    
    console.log(`✅ ${totalComandos} comandos carregados`);
} catch (error) {
    console.error('❌ Erro ao carregar comandos:', error);
    process.exit(1);
}

console.log('📡 Carregando eventos...');

// Carregar eventos
try {
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
} catch (error) {
    console.error('❌ Erro ao carregar eventos:', error);
    process.exit(1);
}

console.log('🌐 Iniciando servidor web...');

// Servidor web para UptimeRobot
// Servidor web para UptimeRobot
const app = express();

// Endpoint principal (mais rápido)
app.get('/', (req, res) => {
    const data = {
        status: 'online',
        bot: client.user?.tag || 'Carregando...',
        uptime: Math.floor(process.uptime()),
        servers: client.guilds.cache.size,
        users: client.users.cache.size,
        timestamp: new Date().toISOString()
    };
    
    console.log('🔔 Ping recebido do UptimeRobot');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(JSON.stringify(data));
});

// Endpoint de saúde (ultra rápido)
app.get('/health', (req, res) => {
    res.status(200).send('online');
});

// Endpoint de ping simples
app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor web rodando na porta ${PORT}`);
});

console.log('🔐 Fazendo login...');

// Login com tratamento de erros
const token = config.token || process.env.BOT_TOKEN;

client.login(token)
    .then(() => {
        console.log('✅ Login realizado com sucesso!');
    })
    .catch(error => {
        console.error('❌ Erro ao fazer login:', error);
        if (error.code === 'TokenInvalid') {
            console.error('Token inválido! Verifique se o BOT_TOKEN está correto no Render');
        }
        process.exit(1);
    });

// Tratamento de erros não capturados
process.on('unhandledRejection', error => {
    console.error('❌ Erro não tratado:', error);
});

process.on('uncaughtException', error => {
    console.error('❌ Exceção não capturada:', error);
    process.exit(1);
});