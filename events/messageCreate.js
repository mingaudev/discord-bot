const { Events, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

const PREFIX = 'r.';

// ==================== SISTEMA DE CENSURA ====================

// ⚠️ COLOQUE SEU ID AQUI (pegue com: Configurações > Avançado > Modo Desenvolvedor > Clique direito em você > Copiar ID)
const DONO_ID = '1384263522422231201';

const CENSURA_PATH = './database/censura.json';

function getCensuraDB() {
    if (!fs.existsSync('./database')) {
        fs.mkdirSync('./database');
    }
    if (!fs.existsSync(CENSURA_PATH)) {
        fs.writeFileSync(CENSURA_PATH, JSON.stringify({ users: {} }));
    }
    return JSON.parse(fs.readFileSync(CENSURA_PATH, 'utf8'));
}

function saveCensuraDB(db) {
    fs.writeFileSync(CENSURA_PATH, JSON.stringify(db, null, 2));
}

// ==================== DATABASES ====================

const NIVEL_PATH = './database/niveis.json';
const ECON_PATH = './database/economia.json';

function getDB(path, defaultData = { users: {} }) {
    if (!fs.existsSync('./database')) {
        fs.mkdirSync('./database');
    }
    if (!fs.existsSync(path)) {
        fs.writeFileSync(path, JSON.stringify(defaultData));
    }
    return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function saveDB(path, db) {
    fs.writeFileSync(path, JSON.stringify(db, null, 2));
}

function getEconUser(userId) {
    const db = getDB(ECON_PATH);
    if (!db.users[userId]) {
        db.users[userId] = {
            rubis: 0,
            banco: 0,
            lastDaily: 0,
            streak: 0,
            lastWork: 0,
            lastCrime: 0,
            lastRob: 0
        };
        saveDB(ECON_PATH, db);
    }
    return db.users[userId];
}

function updateEconUser(userId, data) {
    const db = getDB(ECON_PATH);
    if (!db.users[userId]) {
        db.users[userId] = { rubis: 0, banco: 0, lastDaily: 0, streak: 0, lastWork: 0, lastCrime: 0, lastRob: 0 };
    }
    db.users[userId] = { ...db.users[userId], ...data };
    saveDB(ECON_PATH, db);
}

function getNivelUser(userId) {
    const db = getDB(NIVEL_PATH);
    if (!db.users[userId]) {
        db.users[userId] = { xp: 0, level: 1, messages: 0, lastXp: 0 };
        saveDB(NIVEL_PATH, db);
    }
    return db.users[userId];
}

function updateNivelUser(userId, data) {
    const db = getDB(NIVEL_PATH);
    if (!db.users[userId]) {
        db.users[userId] = { xp: 0, level: 1, messages: 0, lastXp: 0 };
    }
    db.users[userId] = { ...db.users[userId], ...data };
    saveDB(NIVEL_PATH, db);
}

// ==================== MÓDULO PRINCIPAL ====================

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot) return;
        if (!message.guild) return;

        const user = message.author;
        const guild = message.guild;
        const now = Date.now();

        // ==================== VERIFICAR CENSURA (PRIMEIRO!) ====================
        
        const censuraDB = getCensuraDB();
        if (censuraDB.users[user.id] === true) {
            await message.delete().catch(() => {});
            return;
        }

        // ==================== COMANDO CENSURAR ====================
        
        if (message.content.toLowerCase().startsWith('censurar ')) {
            if (user.id !== DONO_ID) return;

            const args = message.content.slice(9).trim().split(/ +/);
            const porcentagem = args[0];
            const target = message.mentions.users.first();

            await message.delete().catch(() => {});

            if (!target) {
                const reply = await message.channel.send('❌ Use: `censurar 100% @usuario` ou `censurar 0% @usuario`');
                setTimeout(() => reply.delete().catch(() => {}), 3000);
                return;
            }

            if (porcentagem === '100%') {
                censuraDB.users[target.id] = true;
                saveCensuraDB(censuraDB);

                const reply = await message.channel.send({
                    embeds: [new EmbedBuilder()
                        .setColor('#DC2626')
                        .setDescription(`🔇 ${target} foi **censurado**!`)
                    ]
                });
                setTimeout(() => reply.delete().catch(() => {}), 2000);

            } else if (porcentagem === '0%') {
                delete censuraDB.users[target.id];
                saveCensuraDB(censuraDB);

                const reply = await message.channel.send({
                    embeds: [new EmbedBuilder()
                        .setColor('#16A34A')
                        .setDescription(`🔊 ${target} foi **descensurado**!`)
                    ]
                });
                setTimeout(() => reply.delete().catch(() => {}), 2000);

            } else {
                const reply = await message.channel.send('❌ Use `100%` ou `0%`');
                setTimeout(() => reply.delete().catch(() => {}), 3000);
            }

            return;
        }

        // ==================== SISTEMA DE XP ====================
        
        const nivelData = getNivelUser(user.id);

        // Incrementar mensagens SEMPRE
        nivelData.messages++;

        // XP com cooldown de 1 minuto
        if (now - (nivelData.lastXp || 0) >= 60000) {
            const xpGain = Math.floor(Math.random() * 11) + 15;
            nivelData.xp += xpGain;
            nivelData.lastXp = now;

            const xpNeeded = nivelData.level * 100;
            if (nivelData.xp >= xpNeeded) {
                nivelData.level++;
                nivelData.xp = nivelData.xp - xpNeeded;

                const econData = getEconUser(user.id);
                const bonus = nivelData.level * 50;
                updateEconUser(user.id, { rubis: econData.rubis + bonus });

                const embed = new EmbedBuilder()
                    .setColor('#B91C1C')
                    .setTitle('🎉 Level UP!')
                    .setDescription(`Parabéns ${user}! Você subiu para o **Nível ${nivelData.level}**!`)
                    .addFields({ name: '💎 Bônus', value: `+${bonus} rubis!`, inline: true })
                    .setThumbnail(user.displayAvatarURL())
                    .setFooter({ text: 'TASD - Todos Aqui São Donos' });

                message.channel.send({ embeds: [embed] }).catch(() => {});
            }
        }

        updateNivelUser(user.id, nivelData);

        // ==================== COMANDOS DE PREFIXO ====================
        
        // ... RESTO DO CÓDIGO CONTINUA IGUAL ...

        // ==================== COMANDOS DE PREFIXO ====================

        if (!message.content.toLowerCase().startsWith(PREFIX)) return;

        const args = message.content.slice(PREFIX.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        // Aliases
        const aliases = {
            'dep': 'depositar',
            'sac': 'sacar',
            'trans': 'transferir',
            'rk': 'ranking',
            'lb': 'ranking',
            'work': 'trabalhar',
            'rob': 'roubar',
            'bet': 'apostar',
            'bal': 'saldo',
            'money': 'saldo',
            'xp': 'nivel',
            'lvl': 'nivel',
            'av': 'avatar',
            'si': 'serverinfo',
            'ui': 'userinfo',
            'help': 'ajuda'
        };

        const cmd = aliases[commandName] || commandName;

        try {
            switch (cmd) {

                // ==================== AJUDA ====================
                case 'ajuda':
                case 'comandos': {
                    const embed = new EmbedBuilder()
                        .setColor('#B91C1C')
                        .setTitle('👑 TASD Bot - Comandos')
                        .setDescription('Use `r.comando` ou `/comando`\n\n**Prefixo:** `r.`')
                        .addFields(
                            {
                                name: '💎 Economia',
                                value: [
                                    '`r.daily` - Recompensa diária',
                                    '`r.saldo [@user]` - Ver saldo',
                                    '`r.dep <valor>` - Depositar no banco',
                                    '`r.sac <valor>` - Sacar do banco',
                                    '`r.trabalhar` - Trabalhar (1h)',
                                    '`r.crime` - Cometer crime (2h)',
                                    '`r.roubar @user` - Roubar alguém (3h)',
                                    '`r.apostar <valor>` - Apostar rubis',
                                    '`r.trans @user <valor>` - Transferir'
                                ].join('\n')
                            },
                            {
                                name: '🏆 Rankings & Níveis',
                                value: [
                                    '`r.ranking` - Ranking de XP/Níveis',
                                    '`r.ranking rubis` - Ranking de rubis',
                                    '`r.ranking msg` - Ranking de mensagens',
                                    '`r.nivel [@user]` - Ver nível',
                                    '`r.perfil [@user]` - Ver perfil completo'
                                ].join('\n')
                            },
                            {
                                name: '🔧 Utilidades',
                                value: [
                                    '`r.ajuda` - Este menu',
                                    '`r.ping` - Latência do bot',
                                    '`r.avatar [@user]` - Ver avatar',
                                    '`r.serverinfo` - Info do servidor',
                                    '`r.userinfo [@user]` - Info do usuário'
                                ].join('\n')
                            },
                            {
                                name: '🛡️ Moderação',
                                value: [
                                    '`r.ban @user [motivo]` - Banir',
                                    '`r.kick @user [motivo]` - Expulsar',
                                    '`r.clear <quantidade>` - Limpar msgs'
                                ].join('\n')
                            }
                        )
                        .setThumbnail(guild.iconURL())
                        .setFooter({ text: '👑 Todos Aqui São Donos' })
                        .setTimestamp();

                    return message.reply({ embeds: [embed] });
                }

                // ==================== ECONOMIA ====================
                case 'daily': {
                    const userData = getEconUser(user.id);
                    const lastDaily = userData.lastDaily || 0;
                    const oneDayMs = 24 * 60 * 60 * 1000;
                    const timeDiff = now - lastDaily;

                    if (timeDiff < oneDayMs) {
                        const remaining = oneDayMs - timeDiff;
                        const hours = Math.floor(remaining / (60 * 60 * 1000));
                        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

                        return message.reply({
                            embeds: [new EmbedBuilder()
                                .setColor('#DC2626')
                                .setTitle('⏰ Já Pegou o Daily!')
                                .setDescription(`${user}, volte em **${hours}h ${minutes}min**!`)
                            ]
                        });
                    }

                    let streak = 1;
                    let bonus = 0;
                    const twoDaysMs = 48 * 60 * 60 * 1000;

                    if (timeDiff < twoDaysMs && userData.streak > 0) {
                        streak = userData.streak + 1;
                        bonus = Math.min(streak * 100, 1000);
                    }

                    const baseReward = 1000;
                    const totalReward = baseReward + bonus;

                    updateEconUser(user.id, {
                        rubis: userData.rubis + totalReward,
                        lastDaily: now,
                        streak: streak
                    });

                    return message.reply({
                        embeds: [new EmbedBuilder()
                            .setColor('#B91C1C')
                            .setTitle('💎 Recompensa Diária!')
                            .addFields(
                                { name: '💰 Base', value: `${baseReward} rubis`, inline: true },
                                { name: '🔥 Streak', value: `${streak} dia(s)`, inline: true },
                                { name: '⭐ Bônus', value: `+${bonus} rubis`, inline: true },
                                { name: '📦 Total', value: `**${totalReward} rubis**` }
                            )
                            .setThumbnail(user.displayAvatarURL())
                            .setFooter({ text: 'Volte amanhã para manter o streak!' })
                            .setTimestamp()
                        ]
                    });
                }

                case 'saldo':
                case 'bal': {
                    const target = message.mentions.users.first() || user;
                    const userData = getEconUser(target.id);
                    const total = userData.rubis + userData.banco;

                    const db = getDB(ECON_PATH);
                    const sorted = Object.entries(db.users)
                        .map(([id, data]) => ({ id, total: (data.rubis || 0) + (data.banco || 0) }))
                        .sort((a, b) => b.total - a.total);
                    const position = sorted.findIndex(u => u.id === target.id) + 1;

                    return message.reply({
                        embeds: [new EmbedBuilder()
                            .setColor('#B91C1C')
                            .setTitle(`💰 Saldo de ${target.username}`)
                            .addFields(
                                { name: '👛 Carteira', value: `${userData.rubis.toLocaleString()} 💎`, inline: true },
                                { name: '🏦 Banco', value: `${userData.banco.toLocaleString()} 💎`, inline: true },
                                { name: '💵 Total', value: `${total.toLocaleString()} 💎`, inline: true },
                                { name: '🏆 Ranking', value: `#${position || '?'}`, inline: true },
                                { name: '🔥 Streak', value: `${userData.streak || 0} dias`, inline: true }
                            )
                            .setThumbnail(target.displayAvatarURL())
                            .setTimestamp()
                        ]
                    });
                }

                case 'depositar':
                case 'dep': {
                    const valor = parseInt(args[0]);
                    if (!valor || valor < 1) {
                        return message.reply('❌ Use: `r.dep <valor>`');
                    }

                    const userData = getEconUser(user.id);

                    if (userData.rubis < valor) {
                        return message.reply(`❌ Você só tem **${userData.rubis}** 💎 na carteira!`);
                    }

                    updateEconUser(user.id, {
                        rubis: userData.rubis - valor,
                        banco: userData.banco + valor
                    });

                    return message.reply({
                        embeds: [new EmbedBuilder()
                            .setColor('#16A34A')
                            .setTitle('🏦 Depósito Realizado!')
                            .setDescription(`Depositou **${valor.toLocaleString()}** 💎 no banco!`)
                            .addFields(
                                { name: '👛 Carteira', value: `${(userData.rubis - valor).toLocaleString()} 💎`, inline: true },
                                { name: '🏦 Banco', value: `${(userData.banco + valor).toLocaleString()} 💎`, inline: true }
                            )
                        ]
                    });
                }

                case 'sacar':
                case 'sac': {
                    const valor = parseInt(args[0]);
                    if (!valor || valor < 1) {
                        return message.reply('❌ Use: `r.sac <valor>`');
                    }

                    const userData = getEconUser(user.id);

                    if (userData.banco < valor) {
                        return message.reply(`❌ Você só tem **${userData.banco}** 💎 no banco!`);
                    }

                    updateEconUser(user.id, {
                        rubis: userData.rubis + valor,
                        banco: userData.banco - valor
                    });

                    return message.reply({
                        embeds: [new EmbedBuilder()
                            .setColor('#16A34A')
                            .setTitle('🏦 Saque Realizado!')
                            .setDescription(`Sacou **${valor.toLocaleString()}** 💎 do banco!`)
                            .addFields(
                                { name: '👛 Carteira', value: `${(userData.rubis + valor).toLocaleString()} 💎`, inline: true },
                                { name: '🏦 Banco', value: `${(userData.banco - valor).toLocaleString()} 💎`, inline: true }
                            )
                        ]
                    });
                }

                case 'trabalhar':
                case 'work': {
                    const userData = getEconUser(user.id);
                    const cooldown = 60 * 60 * 1000;

                    if (now - userData.lastWork < cooldown) {
                        const remaining = cooldown - (now - userData.lastWork);
                        const minutes = Math.floor(remaining / (60 * 1000));
                        return message.reply(`😴 Descanse mais **${minutes} minutos**!`);
                    }

                    const trabalhos = [
                        { texto: '👨‍💻 Você programou um site', min: 500, max: 1000 },
                        { texto: '🍕 Você entregou pizzas', min: 300, max: 700 },
                        { texto: '🎮 Você fez stream por 2 horas', min: 600, max: 1200 },
                        { texto: '📸 Você fotografou um casamento', min: 800, max: 1500 },
                        { texto: '🎵 Você tocou em um bar', min: 400, max: 900 },
                        { texto: '🧹 Você limpou uma mansão', min: 500, max: 800 },
                        { texto: '📦 Você trabalhou no armazém', min: 400, max: 750 },
                        { texto: '🚗 Você foi Uber por 3 horas', min: 600, max: 1100 },
                        { texto: '👨‍🍳 Você foi chef por um dia', min: 700, max: 1300 },
                        { texto: '🎨 Você pintou um quadro', min: 500, max: 1000 }
                    ];

                    const trabalho = trabalhos[Math.floor(Math.random() * trabalhos.length)];
                    const ganho = Math.floor(Math.random() * (trabalho.max - trabalho.min + 1)) + trabalho.min;

                    updateEconUser(user.id, {
                        rubis: userData.rubis + ganho,
                        lastWork: now
                    });

                    return message.reply({
                        embeds: [new EmbedBuilder()
                            .setColor('#16A34A')
                            .setTitle('💼 Trabalho Concluído!')
                            .setDescription(`${trabalho.texto} e ganhou **${ganho.toLocaleString()}** 💎!`)
                            .setFooter({ text: 'Trabalhe novamente em 1 hora!' })
                        ]
                    });
                }

                case 'crime': {
                    const userData = getEconUser(user.id);
                    const cooldown = 2 * 60 * 60 * 1000;

                    if (now - userData.lastCrime < cooldown) {
                        const remaining = cooldown - (now - userData.lastCrime);
                        const minutes = Math.floor(remaining / (60 * 1000));
                        return message.reply(`🚔 Espere **${minutes} minutos** para cometer outro crime!`);
                    }

                    const sucesso = Math.random() < 0.4;

                    if (sucesso) {
                        const crimes = [
                            { texto: '🏦 Você assaltou um banco', min: 2000, max: 5000 },
                            { texto: '💎 Você roubou uma joalheria', min: 1500, max: 4000 },
                            { texto: '🖥️ Você hackeou uma empresa', min: 2500, max: 6000 },
                            { texto: '🚗 Você roubou um carro de luxo', min: 1800, max: 4500 }
                        ];

                        const crime = crimes[Math.floor(Math.random() * crimes.length)];
                        const ganho = Math.floor(Math.random() * (crime.max - crime.min + 1)) + crime.min;

                        updateEconUser(user.id, {
                            rubis: userData.rubis + ganho,
                            lastCrime: now
                        });

                        return message.reply({
                            embeds: [new EmbedBuilder()
                                .setColor('#16A34A')
                                .setTitle('🔫 Crime Bem-Sucedido!')
                                .setDescription(`${crime.texto} e conseguiu **${ganho.toLocaleString()}** 💎!`)
                            ]
                        });
                    } else {
                        const multa = Math.floor(userData.rubis * 0.3);

                        updateEconUser(user.id, {
                            rubis: Math.max(0, userData.rubis - multa),
                            lastCrime: now
                        });

                        return message.reply({
                            embeds: [new EmbedBuilder()
                                .setColor('#DC2626')
                                .setTitle('🚔 Você Foi Preso!')
                                .setDescription(`Pagou **${multa.toLocaleString()}** 💎 de multa!`)
                            ]
                        });
                    }
                }

                case 'roubar':
                case 'rob': {
                    const target = message.mentions.users.first();
                    if (!target) {
                        return message.reply('❌ Use: `r.roubar @usuario`');
                    }

                    if (target.id === user.id) {
                        return message.reply('❌ Você não pode roubar a si mesmo!');
                    }

                    if (target.bot) {
                        return message.reply('❌ Você não pode roubar bots!');
                    }

                    const userData = getEconUser(user.id);
                    const targetData = getEconUser(target.id);
                    const cooldown = 3 * 60 * 60 * 1000;

                    if (now - userData.lastRob < cooldown) {
                        const remaining = cooldown - (now - userData.lastRob);
                        const minutes = Math.floor(remaining / (60 * 1000));
                        return message.reply(`⏰ Espere **${minutes} minutos** para roubar novamente!`);
                    }

                    if (targetData.rubis < 100) {
                        return message.reply(`${target} não tem rubis suficientes para roubar!`);
                    }

                    const sucesso = Math.random() < 0.35;

                    if (sucesso) {
                        const roubo = Math.floor(targetData.rubis * (Math.random() * 0.3 + 0.1));

                        updateEconUser(user.id, { rubis: userData.rubis + roubo, lastRob: now });
                        updateEconUser(target.id, { rubis: targetData.rubis - roubo });

                        return message.reply({
                            content: `${target}`,
                            embeds: [new EmbedBuilder()
                                .setColor('#16A34A')
                                .setTitle('💰 Roubo Bem-Sucedido!')
                                .setDescription(`${user} roubou **${roubo.toLocaleString()}** 💎 de ${target}!`)
                            ]
                        });
                    } else {
                        const multa = Math.floor(userData.rubis * 0.25);

                        updateEconUser(user.id, { rubis: Math.max(0, userData.rubis - multa), lastRob: now });

                        return message.reply({
                            embeds: [new EmbedBuilder()
                                .setColor('#DC2626')
                                .setTitle('🚔 Você Foi Pego!')
                                .setDescription(`Tentou roubar ${target} mas foi pego!\nMulta: **${multa.toLocaleString()}** 💎`)
                            ]
                        });
                    }
                }

                case 'apostar':
                case 'bet': {
                    const valor = parseInt(args[0]);
                    if (!valor || valor < 10) {
                        return message.reply('❌ Use: `r.apostar <valor>` (mínimo 10)');
                    }

                    const userData = getEconUser(user.id);

                    if (userData.rubis < valor) {
                        return message.reply(`❌ Você só tem **${userData.rubis}** 💎!`);
                    }

                    const reply = await message.reply({
                        embeds: [new EmbedBuilder()
                            .setColor('#EAB308')
                            .setTitle('🎰 Girando...')
                            .setDescription('*Os slots estão girando...*')
                        ]
                    });

                    await new Promise(r => setTimeout(r, 2000));

                    const slots = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣', '👑'];
                    const result = [
                        slots[Math.floor(Math.random() * slots.length)],
                        slots[Math.floor(Math.random() * slots.length)],
                        slots[Math.floor(Math.random() * slots.length)]
                    ];

                    let multiplicador = 0;
                    let mensagem = '';

                    if (result[0] === result[1] && result[1] === result[2]) {
                        if (result[0] === '👑') {
                            multiplicador = 10;
                            mensagem = '👑👑👑 **JACKPOT SUPREMO!** 👑👑👑';
                        } else if (result[0] === '7️⃣') {
                            multiplicador = 7;
                            mensagem = '🎰 **JACKPOT!** 🎰';
                        } else if (result[0] === '💎') {
                            multiplicador = 5;
                            mensagem = '💎 **DIAMANTES!** 💎';
                        } else {
                            multiplicador = 3;
                            mensagem = '🎉 **TRÊS IGUAIS!** 🎉';
                        }
                    } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
                        multiplicador = 1.5;
                        mensagem = '✨ Dois iguais!';
                    }

                    const ganho = Math.floor(valor * multiplicador);
                    const lucro = ganho - valor;
                    const novoSaldo = userData.rubis + lucro;

                    updateEconUser(user.id, { rubis: novoSaldo });

                    return reply.edit({
                        embeds: [new EmbedBuilder()
                            .setColor(multiplicador > 0 ? '#16A34A' : '#DC2626')
                            .setTitle('🎰 Caça-Níquel')
                            .setDescription(`\n# [ ${result.join(' | ')} ]\n\n${mensagem || '😢 Nada...'}`)
                            .addFields(
                                { name: multiplicador > 0 ? '💰 Ganho' : '💸 Perdeu', value: `${lucro >= 0 ? '+' : ''}${lucro.toLocaleString()} 💎`, inline: true },
                                { name: '👛 Saldo', value: `${novoSaldo.toLocaleString()} 💎`, inline: true }
                            )
                        ]
                    });
                }

                case 'transferir':
                case 'trans':
                case 'pagar':
                case 'pay': {
                    const target = message.mentions.users.first();
                    const valor = parseInt(args[1]);

                    if (!target || !valor) {
                        return message.reply('❌ Use: `r.trans @usuario <valor>`');
                    }

                    if (target.id === user.id) {
                        return message.reply('❌ Você não pode transferir para si mesmo!');
                    }

                    if (target.bot) {
                        return message.reply('❌ Você não pode transferir para bots!');
                    }

                    const userData = getEconUser(user.id);

                    if (userData.rubis < valor) {
                        return message.reply(`❌ Você só tem **${userData.rubis}** 💎!`);
                    }

                    const targetData = getEconUser(target.id);

                    updateEconUser(user.id, { rubis: userData.rubis - valor });
                    updateEconUser(target.id, { rubis: targetData.rubis + valor });

                    return message.reply({
                        content: `${target}`,
                        embeds: [new EmbedBuilder()
                            .setColor('#16A34A')
                            .setTitle('💸 Transferência Realizada!')
                            .setDescription(`${user} transferiu **${valor.toLocaleString()}** 💎 para ${target}!`)
                        ]
                    });
                }

                // ==================== RANKINGS ====================
                case 'ranking':
                case 'rank':
                case 'top':
                case 'lb': {
                    const tipo = args[0]?.toLowerCase() || 'nivel';
                    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
                    let ranking = '';
                    let titulo = '';

                    if (tipo === 'rubis' || tipo === 'money' || tipo === 'dinheiro') {
                        titulo = '💎 Ranking de Rubis';
                        const db = getDB(ECON_PATH);
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
                    } else if (tipo === 'msg' || tipo === 'mensagens' || tipo === 'msgs') {
                        titulo = '💬 Ranking de Mensagens';
                        const db = getDB(NIVEL_PATH);
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
                    } else {
                        // Padrão: nível/xp
                        titulo = '📊 Ranking de Níveis';
                        const db = getDB(NIVEL_PATH);
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
                    }

                    return message.reply({
                        embeds: [new EmbedBuilder()
                            .setColor('#B91C1C')
                            .setTitle(titulo)
                            .setDescription(ranking || 'Nenhum dado ainda!')
                            .setThumbnail(guild.iconURL())
                            .setFooter({ text: 'Use: r.ranking [nivel/rubis/msg]' })
                            .setTimestamp()
                        ]
                    });
                }

                case 'nivel':
                case 'level':
                case 'xp':
                case 'lvl': {
                    const target = message.mentions.users.first() || user;
                    const nivelData = getNivelUser(target.id);

                    const xpNeeded = nivelData.level * 100;
                    const progressPercent = Math.min((nivelData.xp / xpNeeded) * 100, 100);
                    const barFilled = Math.floor(progressPercent / 10);
                    const progressBar = '🟥'.repeat(barFilled) + '⬛'.repeat(10 - barFilled);

                    // Posição
                    const db = getDB(NIVEL_PATH);
                    const sorted = Object.entries(db.users || {})
                        .sort((a, b) => (b[1].level || 1) - (a[1].level || 1) || (b[1].xp || 0) - (a[1].xp || 0));
                    const position = sorted.findIndex(([id]) => id === target.id) + 1;

                    return message.reply({
                        embeds: [new EmbedBuilder()
                            .setColor('#B91C1C')
                            .setTitle(`📊 Nível de ${target.username}`)
                            .setThumbnail(target.displayAvatarURL({ size: 256 }))
                            .addFields(
                                { name: '📈 Nível', value: `**${nivelData.level}**`, inline: true },
                                { name: '⭐ XP', value: `${nivelData.xp}/${xpNeeded}`, inline: true },
                                { name: '🏆 Posição', value: `#${position || '?'}`, inline: true },
                                { name: '💬 Mensagens', value: `${nivelData.messages.toLocaleString()}`, inline: true },
                                { name: 'Progresso', value: `${progressBar} ${progressPercent.toFixed(1)}%` }
                            )
                            .setTimestamp()
                        ]
                    });
                }

                case 'perfil':
                case 'profile': {
                    const target = message.mentions.users.first() || user;
                    const econData = getEconUser(target.id);
                    const nivelData = getNivelUser(target.id);
                    const member = await guild.members.fetch(target.id).catch(() => null);

                    const econDb = getDB(ECON_PATH);
                    const sortedRubis = Object.entries(econDb.users)
                        .map(([id, data]) => ({ id, total: (data.rubis || 0) + (data.banco || 0) }))
                        .sort((a, b) => b.total - a.total);
                    const posRubis = sortedRubis.findIndex(u => u.id === target.id) + 1;

                    const nivelDb = getDB(NIVEL_PATH);
                    const sortedNivel = Object.entries(nivelDb.users || {})
                        .sort((a, b) => (b[1].level || 1) - (a[1].level || 1));
                    const posNivel = sortedNivel.findIndex(([id]) => id === target.id) + 1;

                    const xpNeeded = nivelData.level * 100;
                    const progressPercent = Math.min((nivelData.xp / xpNeeded) * 100, 100);
                    const barFilled = Math.floor(progressPercent / 10);
                    const progressBar = '🟥'.repeat(barFilled) + '⬛'.repeat(10 - barFilled);

                    const embed = new EmbedBuilder()
                        .setColor('#B91C1C')
                        .setTitle(`👑 Perfil de ${target.username}`)
                        .setThumbnail(target.displayAvatarURL({ size: 256 }))
                        .addFields(
                            { name: '💎 Rubis', value: `👛 ${econData.rubis.toLocaleString()}\n🏦 ${econData.banco.toLocaleString()}`, inline: true },
                            { name: '🏆 Ranks', value: `💎 #${posRubis || '?'}\n📊 #${posNivel || '?'}`, inline: true },
                            { name: '🔥 Streak', value: `${econData.streak || 0} dias`, inline: true },
                            { name: '📊 Nível', value: `${nivelData.level}`, inline: true },
                            { name: '💬 Msgs', value: `${nivelData.messages.toLocaleString()}`, inline: true },
                            { name: '⭐ XP', value: `${nivelData.xp}/${xpNeeded}`, inline: true },
                            { name: 'Progresso', value: `${progressBar} ${progressPercent.toFixed(1)}%` }
                        )
                        .setTimestamp();

                    if (member) {
                        embed.addFields({ name: '📅 Entrou', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`, inline: true });
                    }

                    return message.reply({ embeds: [embed] });
                }

                // ==================== UTILIDADES ====================
                case 'ping': {
                    const latencia = Date.now() - message.createdTimestamp;
                    const apiLatencia = Math.round(client.ws.ping);

                    return message.reply({
                        embeds: [new EmbedBuilder()
                            .setColor('#B91C1C')
                            .setTitle('🏓 Pong!')
                            .addFields(
                                { name: '📡 Latência', value: `${latencia}ms`, inline: true },
                                { name: '💻 API', value: `${apiLatencia}ms`, inline: true }
                            )
                        ]
                    });
                }

                case 'avatar':
                case 'av': {
                    const target = message.mentions.users.first() || user;
                    const avatarURL = target.displayAvatarURL({ dynamic: true, size: 4096 });

                    return message.reply({
                        embeds: [new EmbedBuilder()
                            .setColor('#B91C1C')
                            .setTitle(`🖼️ Avatar de ${target.username}`)
                            .setImage(avatarURL)
                        ]
                    });
                }

                case 'serverinfo':
                case 'si': {
                    return message.reply({
                        embeds: [new EmbedBuilder()
                            .setColor('#B91C1C')
                            .setTitle(`📊 ${guild.name}`)
                            .setThumbnail(guild.iconURL({ size: 256 }))
                            .addFields(
                                { name: '👑 Dono', value: `<@${guild.ownerId}>`, inline: true },
                                { name: '👥 Membros', value: `${guild.memberCount}`, inline: true },
                                { name: '📁 Canais', value: `${guild.channels.cache.size}`, inline: true },
                                { name: '😀 Emojis', value: `${guild.emojis.cache.size}`, inline: true },
                                { name: '🎭 Cargos', value: `${guild.roles.cache.size}`, inline: true },
                                { name: '📅 Criado', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true }
                            )
                        ]
                    });
                }

                case 'userinfo':
                case 'ui': {
                    const target = message.mentions.users.first() || user;
                    const member = await guild.members.fetch(target.id).catch(() => null);

                    const embed = new EmbedBuilder()
                        .setColor('#B91C1C')
                        .setTitle(`👤 ${target.username}`)
                        .setThumbnail(target.displayAvatarURL({ size: 256 }))
                        .addFields(
                            { name: '🆔 ID', value: target.id, inline: true },
                            { name: '📅 Conta criada', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:D>`, inline: true }
                        );

                    if (member) {
                        embed.addFields({ name: '📥 Entrou', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`, inline: true });
                    }

                    return message.reply({ embeds: [embed] });
                }

                // ==================== MODERAÇÃO ====================
                case 'ban': {
                    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
                        return message.reply('❌ Você não tem permissão para banir!');
                    }

                    const target = message.mentions.members.first();
                    if (!target) {
                        return message.reply('❌ Use: `r.ban @usuario [motivo]`');
                    }

                    if (!target.bannable) {
                        return message.reply('❌ Não posso banir este usuário!');
                    }

                    const motivo = args.slice(1).join(' ') || 'Sem motivo';

                    await target.ban({ reason: motivo });

                    return message.reply({
                        embeds: [new EmbedBuilder()
                            .setColor('#DC2626')
                            .setTitle('🔨 Usuário Banido')
                            .addFields(
                                { name: 'Usuário', value: `${target.user.tag}`, inline: true },
                                { name: 'Moderador', value: `${user.tag}`, inline: true },
                                { name: 'Motivo', value: motivo }
                            )
                            .setTimestamp()
                        ]
                    });
                }

                case 'kick': {
                    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
                        return message.reply('❌ Você não tem permissão para expulsar!');
                    }

                    const target = message.mentions.members.first();
                    if (!target) {
                        return message.reply('❌ Use: `r.kick @usuario [motivo]`');
                    }

                    if (!target.kickable) {
                        return message.reply('❌ Não posso expulsar este usuário!');
                    }

                    const motivo = args.slice(1).join(' ') || 'Sem motivo';

                    await target.kick(motivo);

                    return message.reply({
                        embeds: [new EmbedBuilder()
                            .setColor('#EAB308')
                            .setTitle('👢 Usuário Expulso')
                            .addFields(
                                { name: 'Usuário', value: `${target.user.tag}`, inline: true },
                                { name: 'Moderador', value: `${user.tag}`, inline: true },
                                { name: 'Motivo', value: motivo }
                            )
                            .setTimestamp()
                        ]
                    });
                }

                case 'clear':
                case 'limpar':
                case 'purge': {
                    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                        return message.reply('❌ Você não tem permissão para limpar mensagens!');
                    }

                    const quantidade = parseInt(args[0]);
                    if (!quantidade || quantidade < 1 || quantidade > 100) {
                        return message.reply('❌ Use: `r.clear <1-100>`');
                    }

                    await message.delete().catch(() => {});
                    const deleted = await message.channel.bulkDelete(quantidade, true);

                    const reply = await message.channel.send({
                        embeds: [new EmbedBuilder()
                            .setColor('#16A34A')
                            .setDescription(`🧹 **${deleted.size}** mensagens deletadas!`)
                        ]
                    });

                    setTimeout(() => reply.delete().catch(() => {}), 3000);
                    break;
                }

            }
        } catch (error) {
            console.error('Erro no comando de prefixo:', error);
            message.reply('❌ Ocorreu um erro ao executar este comando!').catch(() => {});
        }
    }
};