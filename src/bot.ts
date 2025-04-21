import { Client, GatewayIntentBits, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config(); // lädt die .env-Datei

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once('ready', async () => {
  console.log(`${client.user?.tag} ist eingeloggt!`);
  const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Antwortet mit Pong!');

  const commands = await client.application?.commands.set([data.toJSON()]);
  if (!commands) {
    console.error('Fehler beim Registrieren der Slash-Commands');
    return;
  }
  // Log the registered commands to the console
  console.log('Slash-Commands registriert:', commands.map(cmd => cmd.name).join(', '));

});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'ping') {
    await interaction.reply('Pong!');
  }
});


client.login(process.env.BOT_TOKEN);
