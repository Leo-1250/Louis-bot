// Nạp token từ file .env
require('dotenv').config();

// Import các module từ discord.js
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
} = require('discord.js');

// Tạo client cho bot với quyền cơ bản
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Định nghĩa slash command /create
const commands = [
  new SlashCommandBuilder()
    .setName('create')
    .setDescription('Tạo một webhook mới')
    .addStringOption(option =>
      option.setName('webhook')
        .setDescription('Tên webhook muốn tạo')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('channel')
        .setDescription('Tên kênh Discord')
        .setRequired(true))
].map(cmd => cmd.toJSON());

// Gửi command lên server (tự động khi bot khởi động)
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

client.once('ready', async () => {
  console.log(`✅ Bot Louis đã online với tên: ${client.user.tag}`);

  try {
    const appId = client.user.id;
    const guilds = client.guilds.cache.map(g => g.id);

    // Đăng ký command cho từng server
    for (const guildId of guilds) {
      await rest.put(
        Routes.applicationGuildCommands(appId, guildId),
        { body: commands }
      );
    }

    console.log('✅ Slash command đã được đăng ký!');
  } catch (err) {
    console.error('❌ Lỗi khi đăng ký command:', err);
  }
});

// Xử lý lệnh khi người dùng gọi /create
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'create') {
    const webhookName = interaction.options.getString('webhook');
    const channelName = interaction.options.getString('channel');

    // Tìm kênh theo tên
    const channel = interaction.guild.channels.cache.find(
      c => c.name === channelName
    );

    if (!channel || !channel.isTextBased()) {
      return interaction.reply({
        content: `❌ Không tìm thấy kênh tên **${channelName}** hoặc không phải kênh văn bản.`,
        ephemeral: true
      });
    }

    try {
      const webhook = await channel.createWebhook({ name: webhookName });
      return interaction.reply(`✅ Webhook **${webhookName}** đã được tạo tại **#${channel.name}**!\n🔗 URL: ${webhook.url}`);
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: `❌ Không thể tạo webhook. Hãy kiểm tra quyền của bot.`,
        ephemeral: true
      });
    }
  }
});

// Kết nối bot với Discord
client.login(process.env.DISCORD_TOKEN);
