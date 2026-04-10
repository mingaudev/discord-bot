const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const commands = [
    new SlashCommandBuilder()
        .setName('rank')
        .setDescription('🏆 Veja os rankings do servidor')
        .addStringOption(opt =>
            opt.setName('tipo')
                .setDescription('Tipo de ranking')
                .setRequired(true) //a
                .addChoices(
                    { name: '💎 Rubis (mais rico)', value: 'rubis' },
                    { name: '💬 Mensagens (mais ativo)', value: 'mensagens' },
                    { name: '📊 Nível (maior nível)', value: 'nivel' }
                )),

    new SlashCommandBuilder()
        .setName('nivel')
        .setDescription('📊 Veja seu nível e XP')
        .addUserOption(opt => opt.setName('usuario').setDescription('Ver nível de outro usuário'))
];

async function execute(interaction) {
    const { commandName, user, options, guild } = interaction;

    switch (commandName) {
        case 'rank': {
            const tipo = options.getString('tipo');
            await interaction.deferReply();

            let ranking = '';
            const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

            if (tipo === 'rubis') {
                const econPath = './database/economia.json';
                if (!fs.existsSync(econPath)) {
                    return interaction.editReply('❌ Nenhum dado de economia ainda!');
                }

                const db = JSON.parse(fs.readFileSync(econPath, 'utf8'));
                const sorted = Object.entries(db.users)
                    .map(([id, data]) => ({ id, total: (data.rubis || 0) + (data.banco || 0) }))
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 10);

                for (let i = 0; i < sorted.length; i++) {
                    const { id, total } = sorted[i];
                    let name = 'Desconhecido';
                    try {
                        const member = await guild.members.fetch(id);
                        name = member.user.username;
                    } catch {}
                    ranking += `${medals[i]} **${name}** — ${total.toLocaleString()} 💎\n`;
                }

                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('#B91C1C')
                        .setTitle('💎 Ranking de Rubis')
                        .setDescription(ranking || 'Nenhum usuário ainda!')
                        .setThumbnail(guild.iconURL())
                        .setFooter({ text: 'TASD - Todos Aqui São Donos' })
                        .setTimestamp()
                    ]
                });
            }

            if (tipo === 'mensagens') {
                const nivelPath = './database/niveis.json';
                if (!fs.existsSync(nivelPath)) {
                    return interaction.editReply('❌ Nenhum dado de mensagens ainda!');
                }

                const db = JSON.parse(fs.readFileSync(nivelPath, 'utf8'));
                const sorted = Object.entries(db.users || {})
                    .map(([id, data]) => ({ id, messages: data.messages || 0 }))
                    .sort((a, b) => b.messages - a.messages)
                    .slice(0, 10);

                for (let i = 0; i < sorted.length; i++) {
                    const { id, messages } = sorted[i];
                    let name = 'Desconhecido';
                    try {
                        const member = await guild.members.fetch(id);
                        name = member.user.username;
                    } catch {}
                    ranking += `${medals[i]} **${name}** — ${messages.toLocaleString()} 💬\n`;
                }

                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('#B91C1C')
                        .setTitle('💬 Ranking de Mensagens')
                        .setDescription(ranking || 'Nenhum usuário ainda!')
                        .setThumbnail(guild.iconURL())
                        .setFooter({ text: 'Quem manda mais mensagem!' })
                        .setTimestamp()
                    ]
                });
            }

            if (tipo === 'nivel') {
                const nivelPath = './database/niveis.json';
                if (!fs.existsSync(nivelPath)) {
                    return interaction.editReply('❌ Nenhum dado de nível ainda!');
                }

                const db = JSON.parse(fs.readFileSync(nivelPath, 'utf8'));
                const sorted = Object.entries(db.users || {})
                    .map(([id, data]) => ({ id, level: data.level || 1, xp: data.xp || 0 }))
                    .sort((a, b) => b.level - a.level || b.xp - a.xp)
                    .slice(0, 10);

                for (let i = 0; i < sorted.length; i++) {
                    const { id, level, xp } = sorted[i];
                    let name = 'Desconhecido';
                    try {
                        const member = await guild.members.fetch(id);
                        name = member.user.username;
                    } catch {}
                    ranking += `${medals[i]} **${name}** — Nível ${level} (${xp} XP)\n`;
                }

                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('#B91C1C')
                        .setTitle('📊 Ranking de Níveis')
                        .setDescription(ranking || 'Nenhum usuário ainda!')
                        .setThumbnail(guild.iconURL())
                        .setFooter({ text: 'Os mais experientes!' })
                        .setTimestamp()
                    ]
                });
            }
            break;
        }

        case 'nivel': {
            const target = options.getUser('usuario') || user;
            
            const nivelPath = './database/niveis.json';
            let nivelData = { xp: 0, level: 1, messages: 0 };
            
            if (fs.existsSync(nivelPath)) {
                const db = JSON.parse(fs.readFileSync(nivelPath, 'utf8'));
                if (db.users?.[target.id]) {
                    nivelData = db.users[target.id];
                }
            }

            const xpNeeded = nivelData.level * 100;
            const progressPercent = Math.min((nivelData.xp / xpNeeded) * 100, 100);
            const barFilled = Math.floor(progressPercent / 10);
            const progressBar = '🟥'.repeat(barFilled) + '⬛'.repeat(10 - barFilled);

            // Posição no ranking
            let position = '?';
            if (fs.existsSync(nivelPath)) {
                const db = JSON.parse(fs.readFileSync(nivelPath, 'utf8'));
                const sorted = Object.entries(db.users || {})
                    .sort((a, b) => (b[1].level || 1) - (a[1].level || 1) || (b[1].xp || 0) - (a[1].xp || 0));
                position = sorted.findIndex(([id]) => id === target.id) + 1;
            }

            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#B91C1C')
                    .setTitle(`📊 Nível de ${target.username}`)
                    .setThumbnail(target.displayAvatarURL({ size: 256 }))
                    .addFields(
                        { name: '📈 Nível', value: `**${nivelData.level}**`, inline: true },
                        { name: '⭐ XP', value: `${nivelData.xp}/${xpNeeded}`, inline: true },
                        { name: '🏆 Posição', value: `#${position}`, inline: true },
                        { name: '💬 Mensagens', value: `${nivelData.messages.toLocaleString()}`, inline: true },
                        { name: 'Progresso', value: `${progressBar}\n${progressPercent.toFixed(1)}%` }
                    )
                    .setFooter({ text: 'TASD - Todos Aqui São Donos' })
                    .setTimestamp()
                ]
            });
        }
    }
}

module.exports = { commands, execute };