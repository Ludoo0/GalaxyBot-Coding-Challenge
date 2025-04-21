// Imports
import { Client, GatewayIntentBits, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';



dotenv.config(); // lädt die .env-Datei

// Client
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Database
const sqlite = require('sqlite3').verbose();
let db = new sqlite.Database('./database.db', sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE);


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

  // Create Database Table
  db.run(`CREATE TABLE IF NOT EXISTS incidents(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT NOT NULL, messageid TEXT NOT NULL, status TEXT NOT NULL, created_at TIMESTAMP NOT NULL)`)
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
