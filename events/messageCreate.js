const { Events, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const NIVEL_PATH = './database/niveis.json';

function getNivelDB() {
    if (!fs.existsSync('./database')) {
        fs.mkdirSync('./database');
    }
    if (!fs.existsSync(NIVEL_PATH)) {
        fs.writeFileSync(NIVEL_PATH, JSON.stringify({ users: {} }));
    }
    return JSON.parse(fs.readFileSync(NIVEL_PATH, 'utf8'));
}

function saveNivelDB(db) {
    fs.writeFileSync(NIVEL_PATH, JSON.stringify(db, null, 2));
}

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot) return;
        if (!message.guild) return;

        const db = getNivelDB();
        const userId = message.author.id;

        if (!db.users[userId]) {
            db.users[userId] = { xp: 0, level: 1, messages: 0, lastXp: 0 };
        }

        const userData = db.users[userId];
        const now = Date.now();

        // Incrementar mensagens SEMPRE
        userData.messages++;

        // XP com cooldown de 1 minuto
        if (now - (userData.lastXp || 0) >= 60000) {
            const xpGain = Math.floor(Math.random() * 11) + 15; // 15-25 XP
            userData.xp += xpGain;
            userData.lastXp = now;

            // Check level up
            const xpNeeded = userData.level * 100;
            if (userData.xp >= xpNeeded) {
                userData.level++;
                userData.xp = userData.xp - xpNeeded;

                // Bônus de rubis por level up
                const econPath = './database/economia.json';
                if (fs.existsSync(econPath)) {
                    const econDB = JSON.parse(fs.readFileSync(econPath, 'utf8'));
                    if (!econDB.users[userId]) {
                        econDB.users[userId] = { rubis: 0, banco: 0, lastDaily: 0, streak: 0, lastWork: 0, lastCrime: 0, lastRob: 0 };
                    }
                    const bonus = userData.level * 50; // 50 rubis por nível
                    econDB.users[userId].rubis += bonus;
                    fs.writeFileSync(econPath, JSON.stringify(econDB, null, 2));
                }

                // Notificar level up
                const embed = new EmbedBuilder()
                    .setColor('#B91C1C')
                    .setTitle('🎉 Level UP!')
                    .setDescription(`Parabéns ${message.author}! Você subiu para o **Nível ${userData.level}**!`)
                    .addFields(
                        { name: '💎 Bônus', value: `+${userData.level * 50} rubis!`, inline: true }
                    )
                    .setThumbnail(message.author.displayAvatarURL())
                    .setFooter({ text: 'TASD - Todos Aqui São Donos' });

                message.channel.send({ embeds: [embed] }).catch(() => {});
            }
        }

        db.users[userId] = userData;
        saveNivelDB(db);
    }
};