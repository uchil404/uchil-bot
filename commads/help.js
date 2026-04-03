// commands/help.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'help',
  aliases: ['h', 'bantuan', 'command'],
  description: 'Menampilkan daftar command yang tersedia',
  cooldown: 10,
  
  async execute(client, message, args) {
    const prefix = client.prefix;
    const commands = Array.from(client.commands.values())
      .filter(cmd => !cmd.ownerOnly || message.author.id === client.config.ownerId);
    
    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor || '#5865F2')
      .setTitle('📚 Daftar Command')
      .setDescription(`Gunakan \`${prefix}<command>\` untuk menjalankan command.\n\n**Total Command:** ${commands.length}`)
      .setFooter({ text: client.config.footerText || '© Uchil Bot' })
      .setTimestamp();
    
    // Group commands by category (opsional)
    const categories = {
      '🎵 Musik': ['play', 'skip', 'pause', 'resume', 'queue', 'stop'],
      'ℹ️ Info': ['ping', 'help', 'invite', 'stats'],
      '🔧 Utility': ['prefix', 'serverinfo', 'userinfo']
    };
    
    for (const [category, cmds] of Object.entries(categories)) {
      const available = commands.filter(c => cmds.includes(c.name) && !c.ownerOnly);
      if (available.length) {
        const desc = available.map(c => `\`${c.name}\` - ${c.description || 'Tanpa deskripsi'}`).join('\n');
        embed.addFields({ name: category, value: desc, inline: false });
      }
    }
    
    await message.reply({ embeds: [embed] });
  }
};