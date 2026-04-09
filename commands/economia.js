const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const DB_PATH = './database/economia.json';

// Funções do banco de dados
function getDB() {
    if (!fs.existsSync('./database')) {
        fs.mkdirSync('./database');
    }
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify({ users: {} }));
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function saveDB(db) {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function getUser(userId) {
    const db = getDB();
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
        saveDB(db);
    }
    return db.users[userId];
}

function updateUser(userId, data) {
    const db = getDB();
    if (!db.users[userId]) {
        db.users[userId] = { rubis: 0, banco: 0, lastDaily: 0, streak: 0, lastWork: 0, lastCrime: 0, lastRob: 0 };
    }
    db.users[userId] = { ...db.users[userId], ...data };
    saveDB(db);
}

// Comandos
const commands = [
    new SlashCommandBuilder()
        .setName('daily')
        .setDescription('💎 Pegue sua recompensa diária de rubis'),
    
    new SlashCommandBuilder()
        .setName('saldo')
        .setDescription('💰 Veja seus rubis')
        .addUserOption(opt => opt.setName('usuario').setDescription('Ver saldo de outro usuário')),
    
    new SlashCommandBuilder()
        .setName('depositar')
        .setDescription('🏦 Deposite rubis no banco')
        .addIntegerOption(opt => 
            opt.setName('valor')
                .setDescription('Quantidade para depositar (ou "tudo")')
                .setRequired(true)
                .setMinValue(1)),
    
    new SlashCommandBuilder()
        .setName('sacar')
        .setDescription('🏦 Saque rubis do banco')
        .addIntegerOption(opt => 
            opt.setName('valor')
                .setDescription('Quantidade para sacar')
                .setRequired(true)
                .setMinValue(1)),
    
    new SlashCommandBuilder()
        .setName('trabalhar')
        .setDescription('💼 Trabalhe para ganhar rubis'),
    
    new SlashCommandBuilder()
        .setName('crime')
        .setDescription('🔫 Cometa um crime (arriscado!)'),
    
    new SlashCommandBuilder()
        .setName('roubar')
        .setDescription('💰 Tente roubar rubis de alguém')
        .addUserOption(opt => 
            opt.setName('usuario')
                .setDescription('Quem você quer roubar')
                .setRequired(true)),
    
    new SlashCommandBuilder()
        .setName('apostar')
        .setDescription('🎰 Aposte seus rubis')
        .addIntegerOption(opt => 
            opt.setName('valor')
                .setDescription('Quantidade para apostar')
                .setRequired(true)
                .setMinValue(10)),
    
    new SlashCommandBuilder()
        .setName('transferir')
        .setDescription('💸 Transfira rubis para outro usuário')
        .addUserOption(opt => 
            opt.setName('usuario')
                .setDescription('Quem vai receber')
                .setRequired(true))
        .addIntegerOption(opt => 
            opt.setName('valor')
                .setDescription('Quantidade para transferir')
                .setRequired(true)
                .setMinValue(1)),
    
    new SlashCommandBuilder()
        .setName('perfil')
        .setDescription('👤 Veja o perfil de alguém')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuário para ver o perfil'))
];

async function execute(interaction) {
    const { commandName, user, options, guild } = interaction;

    switch (commandName) {
        case 'daily': {
            const userData = getUser(user.id);
            const now = Date.now();
            const lastDaily = userData.lastDaily || 0;
            const oneDayMs = 24 * 60 * 60 * 1000;
            const timeDiff = now - lastDaily;

            if (timeDiff < oneDayMs) {
                const remaining = oneDayMs - timeDiff;
                const hours = Math.floor(remaining / (60 * 60 * 1000));
                const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor('#DC2626')
                        .setTitle('⏰ Já Pegou o Daily!')
                        .setDescription(`${user}, volte em **${hours}h ${minutes}min**!`)
                        .setFooter({ text: 'TASD - Todos Aqui São Donos' })
                    ],
                    ephemeral: true
                });
            }

            // Streak
            let streak = 1;
            let bonus = 0;
            const twoDaysMs = 48 * 60 * 60 * 1000;

            if (timeDiff < twoDaysMs && userData.streak > 0) {
                streak = userData.streak + 1;
                bonus = Math.min(streak * 100, 1000);
            }

            const baseReward = 1000;
            const totalReward = baseReward + bonus;

            updateUser(user.id, {
                rubis: userData.rubis + totalReward,
                lastDaily: now,
                streak: streak
            });

            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#B91C1C')
                    .setTitle('💎 Recompensa Diária!')
                    .setDescription(`${user} pegou seus rubis!`)
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

        case 'saldo': {
            const target = options.getUser('usuario') || user;
            const userData = getUser(target.id);
            const total = userData.rubis + userData.banco;

            const db = getDB();
            const sorted = Object.entries(db.users)
                .map(([id, data]) => ({ id, total: (data.rubis || 0) + (data.banco || 0) }))
                .sort((a, b) => b.total - a.total);
            const position = sorted.findIndex(u => u.id === target.id) + 1;

            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#B91C1C')
                    .setTitle(`💰 Saldo de ${target.username}`)
                    .addFields(
                        { name: '👛 Carteira', value: `${userData.rubis.toLocaleString()} 💎`, inline: true },
                        { name: '🏦 Banco', value: `${userData.banco.toLocaleString()} 💎`, inline: true },
                        { name: '💵 Total', value: `${total.toLocaleString()} 💎`, inline: true },
                        { name: '🏆 Ranking', value: `#${position}`, inline: true },
                        { name: '🔥 Streak', value: `${userData.streak || 0} dias`, inline: true }
                    )
                    .setThumbnail(target.displayAvatarURL())
                    .setFooter({ text: 'TASD - Todos Aqui São Donos' })
                    .setTimestamp()
                ]
            });
        }

        case 'depositar': {
            const valor = options.getInteger('valor');
            const userData = getUser(user.id);

            if (userData.rubis < valor) {
                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor('#DC2626')
                        .setTitle('❌ Saldo Insuficiente!')
                        .setDescription(`${user}, você só tem **${userData.rubis}** 💎 na carteira!`)
                    ],
                    ephemeral: true
                });
            }

            updateUser(user.id, {
                rubis: userData.rubis - valor,
                banco: userData.banco + valor
            });

            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#16A34A')
                    .setTitle('🏦 Depósito Realizado!')
                    .setDescription(`${user} depositou **${valor.toLocaleString()}** 💎 no banco!`)
                    .addFields(
                        { name: '👛 Carteira', value: `${(userData.rubis - valor).toLocaleString()} 💎`, inline: true },
                        { name: '🏦 Banco', value: `${(userData.banco + valor).toLocaleString()} 💎`, inline: true }
                    )
                    .setTimestamp()
                ]
            });
        }

        case 'sacar': {
            const valor = options.getInteger('valor');
            const userData = getUser(user.id);

            if (userData.banco < valor) {
                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor('#DC2626')
                        .setTitle('❌ Saldo Insuficiente!')
                        .setDescription(`${user}, você só tem **${userData.banco}** 💎 no banco!`)
                    ],
                    ephemeral: true
                });
            }

            updateUser(user.id, {
                rubis: userData.rubis + valor,
                banco: userData.banco - valor
            });

            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#16A34A')
                    .setTitle('🏦 Saque Realizado!')
                    .setDescription(`${user} sacou **${valor.toLocaleString()}** 💎 do banco!`)
                    .addFields(
                        { name: '👛 Carteira', value: `${(userData.rubis + valor).toLocaleString()} 💎`, inline: true },
                        { name: '🏦 Banco', value: `${(userData.banco - valor).toLocaleString()} 💎`, inline: true }
                    )
                    .setTimestamp()
                ]
            });
        }

        case 'trabalhar': {
            const userData = getUser(user.id);
            const now = Date.now();
            const cooldown = 60 * 60 * 1000; // 1 hora

            if (now - userData.lastWork < cooldown) {
                const remaining = cooldown - (now - userData.lastWork);
                const minutes = Math.floor(remaining / (60 * 1000));

                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor('#DC2626')
                        .setTitle('😴 Você está cansado!')
                        .setDescription(`${user}, descanse mais **${minutes} minutos**!`)
                    ],
                    ephemeral: true
                });
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

            updateUser(user.id, {
                rubis: userData.rubis + ganho,
                lastWork: now
            });

            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#16A34A')
                    .setTitle('💼 Trabalho Concluído!')
                    .setDescription(`${trabalho.texto} e ganhou **${ganho.toLocaleString()}** 💎!`)
                    .addFields(
                        { name: '👛 Nova Carteira', value: `${(userData.rubis + ganho).toLocaleString()} 💎` }
                    )
                    .setFooter({ text: 'Trabalhe novamente em 1 hora!' })
                    .setTimestamp()
                ]
            });
        }

        case 'crime': {
            const userData = getUser(user.id);
            const now = Date.now();
            const cooldown = 2 * 60 * 60 * 1000; // 2 horas

            if (now - userData.lastCrime < cooldown) {
                const remaining = cooldown - (now - userData.lastCrime);
                const minutes = Math.floor(remaining / (60 * 1000));

                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor('#DC2626')
                        .setTitle('🚔 Você está sendo procurado!')
                        .setDescription(`${user}, espere **${minutes} minutos** para cometer outro crime!`)
                    ],
                    ephemeral: true
                });
            }

            const sucesso = Math.random() < 0.4; // 40% de chance

            if (sucesso) {
                const crimes = [
                    { texto: '🏦 Você assaltou um banco', min: 2000, max: 5000 },
                    { texto: '💎 Você roubou uma joalheria', min: 1500, max: 4000 },
                    { texto: '🖥️ Você hackeou uma empresa', min: 2500, max: 6000 },
                    { texto: '🚗 Você roubou um carro de luxo', min: 1800, max: 4500 },
                    { texto: '🎰 Você trapaceou no cassino', min: 2000, max: 5500 }
                ];

                const crime = crimes[Math.floor(Math.random() * crimes.length)];
                const ganho = Math.floor(Math.random() * (crime.max - crime.min + 1)) + crime.min;

                updateUser(user.id, {
                    rubis: userData.rubis + ganho,
                    lastCrime: now
                });

                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor('#16A34A')
                        .setTitle('🔫 Crime Bem-Sucedido!')
                        .setDescription(`${crime.texto} e conseguiu **${ganho.toLocaleString()}** 💎!`)
                        .addFields(
                            { name: '👛 Nova Carteira', value: `${(userData.rubis + ganho).toLocaleString()} 💎` }
                        )
                        .setFooter({ text: 'A polícia está te procurando... 👀' })
                        .setTimestamp()
                    ]
                });
            } else {
                const multa = Math.floor(userData.rubis * 0.3); // Perde 30%

                updateUser(user.id, {
                    rubis: Math.max(0, userData.rubis - multa),
                    lastCrime: now
                });

                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor('#DC2626')
                        .setTitle('🚔 Você Foi Preso!')
                        .setDescription(`${user} foi pego pela polícia e pagou **${multa.toLocaleString()}** 💎 de multa!`)
                        .addFields(
                            { name: '👛 Nova Carteira', value: `${Math.max(0, userData.rubis - multa).toLocaleString()} 💎` }
                        )
                        .setFooter({ text: 'Crime não compensa... às vezes' })
                        .setTimestamp()
                    ]
                });
            }
        }

        case 'roubar': {
            const target = options.getUser('usuario');
            const userData = getUser(user.id);
            const targetData = getUser(target.id);
            const now = Date.now();
            const cooldown = 3 * 60 * 60 * 1000; // 3 horas

            if (target.id === user.id) {
                return interaction.reply({ content: '❌ Você não pode roubar a si mesmo!', ephemeral: true });
            }

            if (target.bot) {
                return interaction.reply({ content: '❌ Você não pode roubar bots!', ephemeral: true });
            }

            if (now - userData.lastRob < cooldown) {
                const remaining = cooldown - (now - userData.lastRob);
                const minutes = Math.floor(remaining / (60 * 1000));

                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor('#DC2626')
                        .setTitle('⏰ Cooldown!')
                        .setDescription(`${user}, espere **${minutes} minutos** para roubar novamente!`)
                    ],
                    ephemeral: true
                });
            }

            if (targetData.rubis < 100) {
                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor('#DC2626')
                        .setTitle('💸 Alvo Pobre!')
                        .setDescription(`${target} não tem rubis suficientes para roubar!`)
                    ],
                    ephemeral: true
                });
            }

            const sucesso = Math.random() < 0.35; // 35% de chance

            if (sucesso) {
                const roubo = Math.floor(targetData.rubis * (Math.random() * 0.3 + 0.1)); // 10-40%

                updateUser(user.id, { rubis: userData.rubis + roubo, lastRob: now });
                updateUser(target.id, { rubis: targetData.rubis - roubo });

                return interaction.reply({
                    content: `${target}`,
                    embeds: [new EmbedBuilder()
                        .setColor('#16A34A')
                        .setTitle('💰 Roubo Bem-Sucedido!')
                        .setDescription(`${user} roubou **${roubo.toLocaleString()}** 💎 de ${target}!`)
                        .setTimestamp()
                    ]
                });
            } else {
                const multa = Math.floor(userData.rubis * 0.25); // Perde 25%

                updateUser(user.id, { rubis: Math.max(0, userData.rubis - multa), lastRob: now });

                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor('#DC2626')
                        .setTitle('🚔 Você Foi Pego!')
                        .setDescription(`${user} tentou roubar ${target} mas foi pego!\nMulta: **${multa.toLocaleString()}** 💎`)
                        .setTimestamp()
                    ]
                });
            }
        }

        case 'apostar': {
            const valor = options.getInteger('valor');
            const userData = getUser(user.id);

            if (userData.rubis < valor) {
                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor('#DC2626')
                        .setTitle('❌ Saldo Insuficiente!')
                        .setDescription(`${user}, você só tem **${userData.rubis}** 💎!`)
                    ],
                    ephemeral: true
                });
            }

            await interaction.reply({
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

            updateUser(user.id, { rubis: novoSaldo });

            const embed = new EmbedBuilder()
                .setTitle('🎰 Caça-Níquel')
                .setDescription(`\n# [ ${result.join(' | ')} ]\n\n${mensagem || (multiplicador === 0 ? '😢 Nada...' : '')}`)
                .addFields(
                    { name: multiplicador > 0 ? '💰 Ganho' : '💸 Perdeu', value: `${multiplicador > 0 ? '+' : ''}${lucro.toLocaleString()} 💎`, inline: true },
                    { name: '👛 Saldo', value: `${novoSaldo.toLocaleString()} 💎`, inline: true }
                )
                .setColor(multiplicador > 0 ? '#16A34A' : '#DC2626')
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        }

        case 'transferir': {
            const target = options.getUser('usuario');
            const valor = options.getInteger('valor');
            const userData = getUser(user.id);

            if (target.id === user.id) {
                return interaction.reply({ content: '❌ Você não pode transferir para si mesmo!', ephemeral: true });
            }

            if (target.bot) {
                return interaction.reply({ content: '❌ Você não pode transferir para bots!', ephemeral: true });
            }

            if (userData.rubis < valor) {
                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor('#DC2626')
                        .setTitle('❌ Saldo Insuficiente!')
                        .setDescription(`${user}, você só tem **${userData.rubis}** 💎!`)
                    ],
                    ephemeral: true
                });
            }

            const targetData = getUser(target.id);

            updateUser(user.id, { rubis: userData.rubis - valor });
            updateUser(target.id, { rubis: targetData.rubis + valor });

            return interaction.reply({
                content: `${target}`,
                embeds: [new EmbedBuilder()
                    .setColor('#16A34A')
                    .setTitle('💸 Transferência Realizada!')
                    .setDescription(`${user} transferiu **${valor.toLocaleString()}** 💎 para ${target}!`)
                    .addFields(
                        { name: `${user.username}`, value: `${(userData.rubis - valor).toLocaleString()} 💎`, inline: true },
                        { name: `${target.username}`, value: `${(targetData.rubis + valor).toLocaleString()} 💎`, inline: true }
                    )
                    .setTimestamp()
                ]
            });
        }

        case 'perfil': {
            const target = options.getUser('usuario') || user;
            const userData = getUser(target.id);
            const member = await guild.members.fetch(target.id).catch(() => null);

            // Pegar posição no ranking de rubis
            const db = getDB();
            const sortedRubis = Object.entries(db.users)
                .map(([id, data]) => ({ id, total: (data.rubis || 0) + (data.banco || 0) }))
                .sort((a, b) => b.total - a.total);
            const posRubis = sortedRubis.findIndex(u => u.id === target.id) + 1;

            // Pegar dados de nível/mensagens
            let nivelData = { xp: 0, level: 1, messages: 0 };
            const nivelPath = './database/niveis.json';
            if (fs.existsSync(nivelPath)) {
                const nivelDB = JSON.parse(fs.readFileSync(nivelPath, 'utf8'));
                if (nivelDB.users?.[target.id]) {
                    nivelData = nivelDB.users[target.id];
                }
            }

            const xpNeeded = nivelData.level * 100;
            const progressPercent = Math.min((nivelData.xp / xpNeeded) * 100, 100);
            const barFilled = Math.floor(progressPercent / 10);
            const progressBar = '🟥'.repeat(barFilled) + '⬛'.repeat(10 - barFilled);

            const embed = new EmbedBuilder()
                .setColor('#B91C1C')
                .setTitle(`👑 Perfil de ${target.username}`)
                .setThumbnail(target.displayAvatarURL({ size: 256 }))
                .addFields(
                    { name: '💎 Rubis', value: `👛 ${userData.rubis.toLocaleString()}\n🏦 ${userData.banco.toLocaleString()}`, inline: true },
                    { name: '🏆 Rank Rubis', value: `#${posRubis || '?'}`, inline: true },
                    { name: '🔥 Streak', value: `${userData.streak || 0} dias`, inline: true },
                    { name: '📊 Nível', value: `${nivelData.level}`, inline: true },
                    { name: '💬 Mensagens', value: `${nivelData.messages.toLocaleString()}`, inline: true },
                    { name: '⭐ XP', value: `${nivelData.xp}/${xpNeeded}`, inline: true },
                    { name: 'Progresso', value: `${progressBar} ${progressPercent.toFixed(1)}%` }
                )
                .setFooter({ text: 'TASD - Todos Aqui São Donos' })
                .setTimestamp();

            if (member) {
                embed.addFields(
                    { name: '📅 Entrou em', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`, inline: true }
                );
            }

            return interaction.reply({ embeds: [embed] });
        }
    }
}

module.exports = { commands, execute };