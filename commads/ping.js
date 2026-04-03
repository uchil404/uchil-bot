// commands/ping.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'ping',
  aliases: ['pong', 'latency'],
  description: 'Menampilkan latency bot',
  cooldown: 10,
  
  async execute(client, message, args) {
    const sent = await message.reply('🏓 Mengukur...');
    
    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor || '#5865F2')
      .setTitle('🏓 Pong!')
      .addFields(
        { name: '⏱️ Latensi Pesan', value: `\`\`\`${sent.createdTimestamp - message.createdTimestamp}ms\`\`\``, inline: true },
        { name: '💓 Latensi API', value: `\`\`\`${Math.round(client.ws.ping)}ms\`\`\``, inline: true }
      )
      .setFooter({ text: client.config.footerText || '© Uchil Bot', iconURL: client.user?.displayAvatarURL() })
      .setTimestamp();
    
    await sent.edit({ content: null, embeds: [embed] });
  }
};