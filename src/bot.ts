// Imports
import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import { commands } from './commands/'
import { db } from './db';

dotenv.config(); // lädt die .env-Datei

// Client
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});


// Online-Event
client.once('ready', async () => {
  console.log(`${client.user?.tag} ist eingeloggt!`);

  //   Register Commands
  const slashCommands = commands.map(cmd => cmd.data.toJSON());
  await client.application?.commands.set(slashCommands);
  // Log registered commands
  console.log('Slash-Commands registriert:', commands.map(cmd => cmd.data.name).join(', '));

  // Create Database Table
  db.run(`CREATE TABLE IF NOT EXISTS incidents(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT NOT NULL, messageid TEXT NOT NULL, status TEXT NOT NULL, created_at TIMESTAMP NOT NULL, appends INT)`,)
});

// Command-Handler
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;


  const command = commands.find(cmd => cmd.data.name === interaction.commandName);
  if (!command) {
    await interaction.reply({ content: 'Unbekannter Command ', ephemeral: true });
    return;
  }

  try {
    if (interaction.isChatInputCommand()) {
      await command.execute(interaction);
    } else {
      await interaction.reply({ content: 'Dieser Command wird nicht unterstützt.', ephemeral: true });
    }
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: 'Fehler beim Ausführen des Befehls.', ephemeral: true });
  }
});

// Login
module.exports = db;
client.login(process.env.BOT_TOKEN);
