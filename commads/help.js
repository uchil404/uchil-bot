const Discord = require('discord.js');

 module.exports = {
  name: "help", //masukin nama commandnya disini
  alias:["command","h"], //ini alias/singkatan gitu jadi bisa trigger command pake !help !h dll
  description: "List of command", //ini tuh deskripsinya, cuman mungkin sekarang udah ga guna
  run: async(client, message) => {
  const exampleEmbed = new Discord.MessageEmbed()
	.setColor('#0099ff')
	.setTitle('Command List~')
	.setThumbnail('https://lh4.googleusercontent.com/proxy/fE3XEuZT6-AWEdHNtJJXK6bSrInLUqQPc29d4fHkhrJRDpUXrKylILyKPwkINOb86FAwhnlVRv9CZXEWrYp3da6HJ-igGeoN6zGhSboyXotPDo3YwpCn2f3vdvBZdcBSWPMJ=w220-h220')
	.addFields(
		{ name: 'music', value: '`play`, `pause`, `volume`, `stop`, `pause`', inline: true},
		{ name: 'Moderation', value: '`Ban`, `warn`, `kick`, `mute`, `unmute`', inline: true },
    { name: 'Info', value: '`Ping`, `Avatar`', inline: true},
    { name: 'Support Us!', value: '[Invite me here!](https://discord.com/oauth2/authorize?client_id=760923567360966690&scope=bot&permissions=2146958847)', inline: true },
	)
	.setTimestamp()
	.setFooter(`Requested by ${message.author.username}`);

message.channel.send(exampleEmbed);
}
 };