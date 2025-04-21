// Imports
import { Client, CommandInteractionOptionResolver, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, TextChannel } from 'discord.js';
import dotenv from 'dotenv';

const incident_channel_id = '1363891501326668017';
const incident_role_id = '1363891562961965247'; 

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
  const data = [
    new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Antwortet mit Pong!')
      .toJSON(),
    new SlashCommandBuilder()
      .setName('incident_create')
      // TODO: Command Name anpassen
      .setDescription('Erstellt einenen neuen Incident')
      .addStringOption(option => option.setName('title').setDescription('Titel des Incidents').setRequired(true))
      .addStringOption(option => option.setName('description').setDescription('Beschreibung des Incidents').setRequired(true))
      .toJSON()
  ];

  const commands = await client.application?.commands.set(data);
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

//   Incident Create Command
// TODO: In eine eigene Datei auslagern
  if (commandName === 'incident_create') {
    if (!interaction.member || !(interaction.member.roles as any).cache.has(incident_role_id)) {
      await interaction.reply({ content: 'Du hast keine Berechtigung, diesen Befehl zu verwenden.', ephemeral: true });
      return;
    }

    const title = (interaction.options as CommandInteractionOptionResolver).getString('title');
    const description = (interaction.options as CommandInteractionOptionResolver).getString('description');
    const channel = client.channels.cache.get(incident_channel_id);
    if (!channel || !channel.isTextBased() || !(channel instanceof TextChannel)) {
      await interaction.reply({ content: 'Error, ask Bot Admin!', ephemeral: true });
      return;
    }
    let embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle(`Incident - ${title}`)
      .setDescription("Es gibt ein neues Incident!")
      .addFields(
        { name: "Beschreibung", value: description || "Keine Beschreibung angegeben" },
        { name: "Status", value: "Offen" }
      )
      .setTimestamp(Date.now());
      
    let messageid = (await channel.send({embeds: [embed]})).id;
    db.run(`INSERT INTO incidents (name, description, messageid, status, created_at) VALUES (?, ?, ?, ?, ?)`, [title, description, messageid, "open", Date.now()]);
    await interaction.reply({ content: `Incident erstellt! ` , ephemeral: true });
  }
});
// Login
client.login(process.env.BOT_TOKEN);
