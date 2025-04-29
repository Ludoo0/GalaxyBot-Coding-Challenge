// Imports
import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, CommandInteractionOptionResolver, TextChannel, MessageFlags } from 'discord.js';
// import { db } from '../db';
import { openDb } from '../db';
let db: any;
(async () => {
  db = await openDb();
})();

// Variables
const incident_channel_id = '1363891501326668017';
const incident_role_id = '1363891562961965247'; 


export const data = new SlashCommandBuilder()
.setName('incident_create')
      // TODO: Command Name anpassen
      .setDescription('Erstellt einen neuen Incident')
      .addStringOption(option => option.setName('title').setDescription('Titel des Incidents').setRequired(true))
      .addStringOption(option => option.setName('description').setDescription('Beschreibung des Incidents').setRequired(true))

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.member || !(interaction.member.roles as any).cache.has(incident_role_id)) {
        await interaction.reply({ content: 'Du hast keine Berechtigung, diesen Befehl zu verwenden.', flags: MessageFlags.Ephemeral });
        return;
      }
  
      const title = (interaction.options as CommandInteractionOptionResolver).getString('title');
      const description = (interaction.options as CommandInteractionOptionResolver).getString('description');
      const channel = interaction.guild?.channels.cache.get(incident_channel_id);
      if (!channel || !channel.isTextBased() || !(channel instanceof TextChannel)) {
        await interaction.reply({ content: 'Error, ask Bot Admin!', flags: MessageFlags.Ephemeral });
        return;
      }
      let incidents = await db.all(`SELECT * FROM incidents`);

      let embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle(`Incident #${incidents.length + 1}- ${title}`)
        .setDescription("Es gibt ein neues Incident!")
        .addFields(
          { name: "Beschreibung", value: description || "Keine Beschreibung angegeben" },
          { name: "Status", value: "Offen" }
        )
        .setTimestamp(Date.now());
        
      let messageid = (await channel.send({embeds: [embed]})).id;
      db.run(`INSERT INTO incidents (name, description, messageid, status, created_at, appends) VALUES (?, ?, ?, ?, ?, ?)`, [title, description, messageid, "open", Date.now()]), 0;
      await interaction.reply({ content: `Incident erstellt! ` , flags: MessageFlags.Ephemeral });
    }