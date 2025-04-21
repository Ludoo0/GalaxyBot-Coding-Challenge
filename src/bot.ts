// Imports
import { Client, GatewayIntentBits, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config(); // lädt die .env-Datei

// Client
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Online-Event
client.once('ready', async () => {
  console.log(`${client.user?.tag} ist eingeloggt!`);
//   Register Commands
  const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Antwortet mit Pong!');

  const commands = await client.application?.commands.set([data.toJSON()]);
  if (!commands) {
    console.error('Fehler beim Registrieren der Slash-Commands');
    return;
  }
  // Log registered commands
  console.log('Slash-Commands registriert:', commands.map(cmd => cmd.name).join(', '));

});

// Command-Handler
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

//   Ping Command
  if (commandName === 'ping') {
    await interaction.reply('Pong!');
  }
});

// Login
client.login(process.env.BOT_TOKEN);
