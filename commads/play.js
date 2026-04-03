// commands/play.js
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  entersState,
  StreamType,
  getVoiceConnection
} = require('@discordjs/voice');
const play = require('play-dl');

module.exports = {
  name: 'play',
  aliases: ['p', 'mainkan'],
  description: 'Memutar lagu dari YouTube/SoundCloud/Spotify',
  cooldown: 5,
  permissions: ['Connect', 'Speak'],
  
  async execute(client, message, args) {
    const query = args.join(' ');
    
    // Validasi voice channel
    if (!message.member.voice?.channel) {
      return message.reply('❌ Anda harus berada di voice channel terlebih dahulu.');
    }
    
    if (!message.guild.members.me?.permissions.has('Connect')) {
      return message.reply('❌ Bot tidak memiliki izin untuk bergabung ke voice channel.');
    }
    
    if (!query) {
      return message.reply('❌ Silakan berikan judul lagu atau URL.\nContoh: `U/play Despacito`');
    }

    // Loading message
    const loadingMsg = await message.reply('🔍 Mencari...');

    try {
      // Validasi & resolve sumber
      const validate = await play.validate(query);
      let source;
      
      if (['yt_video', 'yt_playlist'].includes(validate)) {
        source = await play.video_info(query);
      } else if (validate === 'so_track') {
        source = await play.soundcloud(query);
      } else if (validate === 'spotify') {
        // Untuk Spotify, kita perlu search YouTube untuk track-nya
        const search = await play.search(query, { limit: 1, source: { youtube: true } });        if (!search.length) throw new Error('Tidak ditemukan hasil untuk track Spotify ini');
        source = await play.video_info(search[0].url);
      } else {
        // Search YouTube
        const search = await play.search(query, { limit: 1 });
        if (!search.length) throw new Error('Tidak ditemukan hasil pencarian.');
        source = await play.video_info(search[0].url);
      }

      // Handle playlist
      if (source.playlist) {
        await loadingMsg.edit(`📋 Menambahkan ${source.playlist.videos.length} lagu ke antrian.`);
        // TODO: Implement playlist queue logic
        return;
      }

      const video = source.video;
      
      // Join voice channel
      const channel = message.member.voice.channel;
      let connection = getVoiceConnection(message.guild.id);
      
      if (!connection) {
        connection = joinVoiceChannel({
          channelId: channel.id,
          guildId: message.guild.id,
          adapterCreator: channel.guild.voiceAdapterCreator,
        });
      }

      // Setup queue untuk guild ini
      if (!client.musicQueues.has(message.guild.id)) {
        client.musicQueues.set(message.guild.id, {
          queue: [],
          current: null,
          player: createAudioPlayer(),
          connection: connection
        });
        connection.subscribe(client.musicQueues.get(message.guild.id).player);
      }
      
      const queue = client.musicQueues.get(message.guild.id);

      // Stream audio
      const streamInfo = await play.stream(video.url, {
        quality: 1, // 0=lowest, 1=medium, 2=highest
        discordPlayerCompatibility: false
      });

      const resource = createAudioResource(streamInfo.stream, {        inputType: streamInfo.type === 'webm/opus' ? StreamType.WebmOpus : StreamType.Arbitrary,
        inlineVolume: true
      });

      // Jika tidak ada lagu yang sedang diputar, mainkan sekarang
      if (!queue.current) {
        queue.current = { ...video, resource };
        queue.player.play(resource);
        
        await loadingMsg.edit(`🎵 Sekarang memutar: **${video.title}**\n🔗 ${video.url}`);
        
        // Handle akhir lagu
        queue.player.on(AudioPlayerStatus.Idle, async () => {
          // Cleanup
          resource.volume?.setVolume(0);
          queue.current = null;
          
          // Mainkan lagu berikutnya jika ada
          if (queue.queue.length > 0) {
            const next = queue.queue.shift();
            // TODO: Play next song logic
          } else {
            // Tinggalkan voice channel setelah idle 30 detik
            setTimeout(() => {
              if (!queue.current && queue.queue.length === 0) {
                connection?.destroy();
                client.musicQueues.delete(message.guild.id);
                message.channel.send('👋 Bot meninggalkan voice channel karena tidak ada lagu dalam antrian.').catch(() => {});
              }
            }, 30000);
          }
        });
      } else {
        // Tambahkan ke antrian
        queue.queue.push({ ...video, resource });
        await loadingMsg.edit(`✅ Ditambahkan ke antrian: **${video.title}**\n📍 Posisi #${queue.queue.length + 1}`);
      }

      // Error handling untuk player
      queue.player.on('error', error => {
        console.error('❌ Audio player error:', error);
        message.channel.send('⚠️ Terjadi kesalahan saat memutar audio.').catch(() => {});
        queue.player.stop();
      });

    } catch (error) {
      console.error('❌ Play command error:', error);
      loadingMsg.edit(`❌ Gagal memutar: ${error.message || 'Unknown error'}`).catch(() => {});
    }
  }};