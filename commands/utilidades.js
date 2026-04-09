const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const commands = [
    new SlashCommandBuilder()
        .setName('ajuda')
        .setDescription('❓ Lista todos os comandos do bot'),

    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('🏓 Veja a latência do bot'),

    new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('🖼️ Veja o avatar de um usuário')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuário para ver o avatar')),

    new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('📊 Informações do servidor'),

    new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('👤 Informações de um usuário')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuário para ver informações'))
];

async function execute(interaction) {
    const { commandName, user, options, guild } = interaction;

    switch (commandName) {
        case 'ajuda': {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#B91C1C')
                    .setTitle('👑 TASD Bot - Comandos')
                    .setDescription('**Todos Aqui São Donos**\n\nBot com economia completa!')
                    .addFields(
                        {
                            name: '💎 Economia',
                            value: '`/daily` - Recompensa diária\n`/saldo` - Ver saldo\n`/depositar` - Depositar no banco\n`/sacar` - Sacar do banco\n`/trabalhar` - Trabalhar\n`/crime` - Cometer crime\n`/roubar` - Roubar alguém\n`/apostar` - Apostar rubis\n`/transferir` - Transferir rubis\n`/perfil` - Ver perfil'
                        },
                        {
                            name: '🏆 Rankings',
                            value: '`/rank rubis` - Mais ricos\n`/rank mensagens` - Mais ativos\n`/rank nivel` - Maior nível\n`/nivel` - Ver seu nível'
                        },
                        {
                            name: '🔧 Utilidades',
                            value: '`/ajuda` - Este menu\n`/ping` - Latência\n`/avatar` - Ver avatar\n`/serverinfo` - Info do servidor\n`/userinfo` - Info do usuário'
                        },
                        {
                            name: '🛡️ Moderação',
                            value: '`/ban` - Banir\n`/kick` - Expulsar\n`/clear` - Limpar mensagens\n`/warn` - Advertir'
                        }
                    )
                    .setThumbnail(guild.iconURL())
                    .setFooter({ text: '👑 Todos Aqui São Donos' })
                    .setTimestamp()
                ]
            });
        }

        case 'ping': {
            const latencia = Date.now() - interaction.createdTimestamp;
            const apiLatencia = Math.round(interaction.client.ws.ping);

            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#B91C1C')
                    .setTitle('🏓 Pong!')
                    .addFields(
                        { name: '📡 Latência', value: `${latencia}ms`, inline: true },
                        { name: '💻 API', value: `${apiLatencia}ms`, inline: true }
                    )
                    .setTimestamp()
                ]
            });
        }

        case 'avatar': {
            const target = options.getUser('usuario') || user;
            const avatarURL = target.displayAvatarURL({ dynamic: true, size: 4096 });

            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#B91C1C')
                    .setTitle(`🖼️ Avatar de ${target.username}`)
                    .setImage(avatarURL)
                    .setFooter({ text: `Pedido por ${user.username}` })
                ]
            });
        }

        case 'serverinfo': {
            return interaction.reply({
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
                        { name: '📅 Criado em', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true }
                    )
                    .setTimestamp()
                ]
            });
        }

        case 'userinfo': {
            const target = options.getUser('usuario') || user;
            const member = await guild.members.fetch(target.id).catch(() => null);

            const embed = new EmbedBuilder()
                .setColor('#B91C1C')
                .setTitle(`👤 ${target.username}`)
                .setThumbnail(target.displayAvatarURL({ size: 256 }))
                .addFields(
                    { name: '🆔 ID', value: target.id, inline: true },
                    { name: '📅 Conta criada', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:D>`, inline: true }
                )
                .setTimestamp();

            if (member) {
                embed.addFields(
                    { name: '📥 Entrou em', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`, inline: true }
                );
            }

            return interaction.reply({ embeds: [embed] });
        }
    }
}

module.exports = { commands, execute };