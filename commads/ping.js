const Discord = require('discord.js')
module.exports = {
  name: "ping", 
  alias:["ping"],
  run: async (client, message, args) => {
    try {
      const m = await message.channel.send(":loading: Calculating Pings...");
      const embed = new Discord.MessageEmbed()
      .setColor("RANDOM")
      .addField(":hourglass: Latency", `**${m.createdTimestamp -  message.createdTimestamp}ms**`)
      .addField(":heartbeat: API", `**${Math.floor(client.ws.ping)}ms**`)
      return m.edit(`🏓 Pong!`, embed);
    } catch (error) {
      return message.channel.send(`Something went wrong: ${error.message}`);
    }
  }
};