// server.js
require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials, ActivityType } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const express = require('express');
const fs = require('fs');
const path = require('path');
const play = require('play-dl');

// Inisialisasi play-dl
play.setToken({
  youtube: {
    cookie: process.env.YOUTUBE_COOKIE || null
  }
});

// Inisialisasi Client Discord.js v14
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction]
});

// Koleksi global
client.commands = new Collection();
client.aliases = new Collection();
client.cooldowns = new Collection();
client.musicQueues = new Map(); // guildId -> queue data

// Load konfigurasi
const config = require('./config.json');
client.config = config;
client.prefix = process.env.PREFIX || config.prefix;

// Load command handler
require('./handler/commandHandler')(client);

// Event: Ready
client.once('ready', async () => {
  console.log(`✅ ${client.user.tag} online!`);
  console.log(`📊 Serving ${client.guilds.cache.size} guild(s)`);
  console.log(`🎮 Activity: ${client.prefix}help`);
  
  client.user.setActivity(`${client.prefix}help`, { type: ActivityType.Listening });
    // Refresh token play-dl jika perlu
  if (await play.is_expired()) {
    await play.refreshToken();
  }
});

// Event: Message Handler (v14: messageCreate)
client.on('messageCreate', async (message) => {
  // Filter dasar
  if (message.author.bot || !message.guild || !message.content.startsWith(client.prefix)) return;

  // Parse command
  const args = message.content.slice(client.prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  
  // Resolve command
  const command = client.commands.get(commandName) || 
                 client.aliases.get(commandName);
  
  if (!command) {
    // Handle mention bot
    if (message.content === `<@${client.user.id}>` || message.content === `<@!${client.user.id}>`) {
      return message.reply(`👋 Halo! Prefix saya adalah \`${client.prefix}\`\nGunakan \`${client.prefix}help\` untuk daftar command.`);
    }
    return;
  }

  // Permission check
  if (command.permissions) {
    if (!message.member.permissions.has(command.permissions)) {
      return message.reply('❌ Anda tidak memiliki izin untuk menggunakan command ini.');
    }
  }

  // Cooldown per-command
  if (!client.cooldowns.has(command.name)) {
    client.cooldowns.set(command.name, new Collection());
  }
  const timestamps = client.cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 3) * 1000;

  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
    if (Date.now() < expirationTime) {
      const timeLeft = (expirationTime - Date.now()) / 1000;
      return message.reply(`⏱️ Mohon tunggu ${timeLeft.toFixed(1)} detik sebelum menggunakan \`${command.name}\` kembali.`);
    }
  }

  timestamps.set(message.author.id, Date.now());  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  // Execute command
  try {
    await command.execute(client, message, args);
  } catch (error) {
    console.error(`❌ Error executing ${commandName}:`, error);
    message.reply('⚠️ Terjadi kesalahan saat memproses command tersebut.').catch(() => {});
  }
});

// Event: Error handling global
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Health check endpoint (untuk hosting gratis)
const app = express();
app.get('/', (req, res) => {
  res.status(200).send({ status: 'ok', uptime: process.uptime() });
});
app.listen(process.env.PORT || 3000, () => {
  console.log(`🌐 Health server running on port ${process.env.PORT || 3000}`);
});

// Login bot
client.login(process.env.DISCORD_TOKEN).catch(err => {
  console.error('❌ Failed to login:', err.message);
  process.exit(1);
});

module.exports = { client, play };