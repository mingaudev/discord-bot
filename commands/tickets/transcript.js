const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-transcript')
        .setDescription('📄 Gera um histórico completo do ticket'),

    async execute(interaction) {
        if (!interaction.channel.name.startsWith('ticket-')) {
            return interaction.reply({
                content: '❌ Este comando só funciona em tickets!',
                ephemeral: true
            });
        }

        await interaction.deferReply();

        try {
            // Buscar todas as mensagens do canal
            let mensagens = [];
            let ultimaId;

            while (true) {
                const options = { limit: 100 };
                if (ultimaId) {
                    options.before = ultimaId;
                }

                const batch = await interaction.channel.messages.fetch(options);
                mensagens.push(...batch.values());

                if (batch.size < 100) break;
                ultimaId = batch.last().id;
            }

            mensagens = mensagens.reverse();

            // Criar HTML do transcript
            const html = gerarHTML(mensagens, interaction);

            // Salvar arquivo
            const nomeArquivo = `transcript-${interaction.channel.name}-${Date.now()}.html`;
            const caminhoArquivo = `./database/${nomeArquivo}`;

            fs.writeFileSync(caminhoArquivo, html);

            const arquivo = new AttachmentBuilder(caminhoArquivo, { name: nomeArquivo });

            // Enviar embed com o arquivo
            await interaction.editReply({
                embeds: [{
                    color: parseInt(interaction.client.config.colors.success.replace('#', ''), 16),
                    title: '📄 Transcript Gerado',
                    description: `Histórico completo de **${mensagens.length}** mensagens.\n\n` +
                                 `**Ticket:** ${interaction.channel.name}\n` +
                                 `**Criado em:** <t:${Math.floor(interaction.channel.createdTimestamp / 1000)}:F>\n` +
                                 `**Gerado por:** ${interaction.user}`,
                    footer: { text: 'TASD - Sistema de Tickets' },
                    timestamp: new Date()
                }],
                files: [arquivo]
            });

            // Deletar arquivo local após envio
            setTimeout(() => {
                if (fs.existsSync(caminhoArquivo)) {
                    fs.unlinkSync(caminhoArquivo);
                }
            }, 5000);

        } catch (error) {
            console.error('Erro ao gerar transcript:', error);
            await interaction.editReply({
                content: '❌ Erro ao gerar o transcript!',
                ephemeral: true
            });
        }
    }
};

function gerarHTML(mensagens, interaction) {
    const canal = interaction.channel;
    const servidor = interaction.guild;

    let html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transcript - ${canal.name}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            background-color: #36393f;
            color: #dcddde;
            font-family: 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: #2f3136;
            border-radius: 8px;
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #B91C1C 0%, #7F1D1D 100%);
            padding: 30px;
            text-align: center;
            border-bottom: 3px solid #991B1B;
        }

        .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
            color: #ffffff;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .header .info {
            font-size: 14px;
            color: #fecaca;
            margin-top: 15px;
        }

        .header .info span {
            display: inline-block;
            margin: 5px 15px;
            padding: 5px 15px;
            background-color: rgba(0,0,0,0.2);
            border-radius: 4px;
        }

        .messages {
            padding: 20px;
        }

        .message {
            display: flex;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 4px;
            transition: background-color 0.2s;
        }

        .message:hover {
            background-color: #32353b;
        }

        .message.system {
            background-color: rgba(185, 28, 28, 0.1);
            border-left: 3px solid #B91C1C;
        }

        .avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            margin-right: 15px;
            flex-shrink: 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .message-content {
            flex: 1;
        }

        .message-header {
            display: flex;
            align-items: center;
            margin-bottom: 5px;
        }

        .username {
            font-weight: 600;
            color: #ffffff;
            margin-right: 10px;
            font-size: 16px;
        }

        .username.bot {
            background-color: #5865F2;
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 12px;
            margin-left: 5px;
        }

        .timestamp {
            font-size: 12px;
            color: #72767d;
        }

        .message-text {
            color: #dcddde;
            line-height: 1.5;
            word-wrap: break-word;
            font-size: 15px;
        }

        .attachment {
            margin-top: 10px;
            padding: 10px;
            background-color: #202225;
            border-radius: 4px;
            border-left: 3px solid #B91C1C;
        }

        .attachment img {
            max-width: 400px;
            max-height: 300px;
            border-radius: 4px;
            margin-top: 5px;
        }

        .embed {
            margin-top: 10px;
            padding: 15px;
            background-color: #2f3136;
            border-left: 4px solid #B91C1C;
            border-radius: 4px;
        }

        .embed-title {
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 8px;
            font-size: 16px;
        }

        .embed-description {
            color: #dcddde;
            font-size: 14px;
            line-height: 1.4;
        }

        .embed-field {
            margin-top: 10px;
        }

        .embed-field-name {
            font-weight: 600;
            color: #ffffff;
            font-size: 14px;
            margin-bottom: 4px;
        }

        .embed-field-value {
            color: #dcddde;
            font-size: 14px;
        }

        .footer {
            background-color: #202225;
            padding: 20px;
            text-align: center;
            color: #72767d;
            font-size: 14px;
            border-top: 1px solid #1a1c1e;
        }

        .footer .crown {
            font-size: 24px;
            margin-bottom: 10px;
        }

        .stats {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-top: 15px;
            flex-wrap: wrap;
        }

        .stat {
            background-color: #2f3136;
            padding: 10px 20px;
            border-radius: 4px;
            border-left: 3px solid #B91C1C;
        }

        .stat-value {
            font-size: 24px;
            font-weight: 700;
            color: #B91C1C;
        }

        .stat-label {
            font-size: 12px;
            color: #72767d;
            margin-top: 5px;
        }

        @media (max-width: 768px) {
            body {
                padding: 10px;
            }

            .header h1 {
                font-size: 24px;
            }

            .message {
                padding: 10px;
            }

            .avatar {
                width: 32px;
                height: 32px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>👑 TASD - Transcript do Ticket</h1>
            <p style="font-size: 18px; margin-top: 10px;">Todos Aqui São Donos</p>
            <div class="info">
                <span>📁 ${escaparHTML(canal.name)}</span>
                <span>🏛️ ${escaparHTML(servidor.name)}</span>
                <span>📅 ${new Date().toLocaleString('pt-BR')}</span>
            </div>
        </div>

        <div class="messages">
`;

    // Contador de estatísticas
    let totalMensagens = 0;
    let totalAnexos = 0;
    let usuarios = new Set();

    mensagens.forEach(msg => {
        totalMensagens++;
        usuarios.add(msg.author.id);
        
        const dataHora = new Date(msg.createdTimestamp).toLocaleString('pt-BR');
        const avatarURL = msg.author.displayAvatarURL({ size: 128 });
        const isBot = msg.author.bot;
        const isSystem = msg.system;

        html += `
            <div class="message ${isSystem ? 'system' : ''}">
                <img src="${avatarURL}" alt="${escaparHTML(msg.author.username)}" class="avatar">
                <div class="message-content">
                    <div class="message-header">
                        <span class="username">${escaparHTML(msg.author.username)}</span>
                        ${isBot ? '<span class="username bot">BOT</span>' : ''}
                        <span class="timestamp">${dataHora}</span>
                    </div>
                    <div class="message-text">${formatarMensagem(msg.content)}</div>
        `;

        // Anexos
        if (msg.attachments.size > 0) {
            msg.attachments.forEach(anexo => {
                totalAnexos++;
                html += `
                    <div class="attachment">
                        <strong>📎 Anexo:</strong> ${escaparHTML(anexo.name)}
                `;
                
                if (anexo.contentType?.startsWith('image/')) {
                    html += `<br><img src="${anexo.url}" alt="${escaparHTML(anexo.name)}">`;
                } else {
                    html += `<br><a href="${anexo.url}" style="color: #B91C1C;">${anexo.url}</a>`;
                }
                
                html += `</div>`;
            });
        }

        // Embeds
        if (msg.embeds.length > 0) {
            msg.embeds.forEach(embed => {
                const corEmbed = embed.color ? `#${embed.color.toString(16).padStart(6, '0')}` : '#B91C1C';
                
                html += `
                    <div class="embed" style="border-left-color: ${corEmbed};">
                `;
                
                if (embed.title) {
                    html += `<div class="embed-title">${escaparHTML(embed.title)}</div>`;
                }
                
                if (embed.description) {
                    html += `<div class="embed-description">${formatarMensagem(embed.description)}</div>`;
                }
                
                if (embed.fields && embed.fields.length > 0) {
                    embed.fields.forEach(field => {
                        html += `
                            <div class="embed-field">
                                <div class="embed-field-name">${escaparHTML(field.name)}</div>
                                <div class="embed-field-value">${formatarMensagem(field.value)}</div>
                            </div>
                        `;
                    });
                }
                
                html += `</div>`;
            });
        }

        html += `
                </div>
            </div>
        `;
    });

    html += `
        </div>

        <div class="footer">
            <div class="crown">👑</div>
            <strong>TASD - Todos Aqui São Donos</strong>
            <p style="margin-top: 10px;">Sistema Profissional de Tickets</p>
            
            <div class="stats">
                <div class="stat">
                    <div class="stat-value">${totalMensagens}</div>
                    <div class="stat-label">Mensagens</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${usuarios.size}</div>
                    <div class="stat-label">Participantes</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${totalAnexos}</div>
                    <div class="stat-label">Anexos</div>
                </div>
            </div>

            <p style="margin-top: 20px; font-size: 12px;">
                Gerado em ${new Date().toLocaleString('pt-BR')}
            </p>
        </div>
    </div>
</body>
</html>
`;

    return html;
}

function escaparHTML(texto) {
    if (!texto) return '';
    return texto
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatarMensagem(texto) {
    if (!texto) return '';
    
    texto = escaparHTML(texto);
    
    // Negrito **texto**
    texto = texto.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Itálico *texto*
    texto = texto.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Sublinhado __texto__
    texto = texto.replace(/__(.*?)__/g, '<u>$1</u>');
    
    // Tachado ~~texto~~
    texto = texto.replace(/~~(.*?)~~/g, '<del>$1</del>');
    
    // Código `texto`
    texto = texto.replace(/`(.*?)`/g, '<code style="background-color: #202225; padding: 2px 6px; border-radius: 3px; color: #B91C1C;">$1</code>');
    
    // Links
    texto = texto.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" style="color: #B91C1C;">$1</a>');
    
    // Quebras de linha
    texto = texto.replace(/\n/g, '<br>');
    
    // Menções @usuário (formato genérico)
    texto = texto.replace(/@(\w+)/g, '<span style="background-color: rgba(185, 28, 28, 0.2); color: #B91C1C; padding: 2px 6px; border-radius: 3px;">@$1</span>');
    
    return texto;
}