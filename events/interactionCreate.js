const { Events, ChannelType, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        // Comandos slash
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({
                    content: '❌ Erro ao executar este comando!',
                    ephemeral: true
                });
            }
        }

        // Botão de abrir ticket
        if (interaction.isButton() && interaction.customId === 'abrir_ticket') {
            const dbPath = './database/tickets.json';
            let db = {};

            if (fs.existsSync(dbPath)) {
                db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
            }

            const config = db[interaction.guild.id];

            if (!config) {
                return interaction.reply({
                    content: '❌ Sistema de tickets não configurado!',
                    ephemeral: true
                });
            }

            // Verificar se já tem ticket aberto
            const ticketExistente = interaction.guild.channels.cache.find(
                c => c.name === `ticket-${interaction.user.username.toLowerCase()}`
            );

            if (ticketExistente) {
                return interaction.reply({
                    content: `❌ Você já tem um ticket aberto: ${ticketExistente}`,
                    ephemeral: true
                });
            }

            // Criar ticket
            config.ticketCounter++;
            db[interaction.guild.id] = config;
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

            const canal = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                parent: config.categoria,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                    },
                    {
                        id: config.cargoStaff,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                    }
                ]
            });

            await canal.send({
                content: `${interaction.user} <@&${config.cargoStaff}>`,
                embeds: [{
                    color: parseInt(client.config.colors.primary.replace('#', ''), 16),
                    title: '🎫 Ticket Criado',
                    description: `Olá ${interaction.user}, bem-vindo ao seu ticket!\n\n` +
                                 `Nossa equipe responderá em breve.\n\n` +
                                 `Para fechar o ticket, use \`/ticket-fechar\``,
                    footer: { text: `Ticket #${config.ticketCounter} | TASD` },
                    timestamp: new Date()
                }]
            });

            await interaction.reply({
                content: `✅ Ticket criado: ${canal}`,
                ephemeral: true
            });
        }
    }
};