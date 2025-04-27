// Imports
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  CommandInteractionOptionResolver,
  TextChannel,
  MessageFlags,
  Message,
  Guild,
  ThreadChannel,
} from "discord.js";
import { db } from "../db";

// Variables
const incident_channel_id = "1363891501326668017";
const incident_role_id = "1363891562961965247";


export const data = new SlashCommandBuilder()
  .setName("incident_append")
  .setDescription("Fügt einen neuen Kommentar zu einem Incident hinzu")
  .addIntegerOption((option) =>
    option
      .setName("incedentid")
      .setDescription("ID des Incedent")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("comment")
      .setDescription("Kommentar des Incidents")
      .setRequired(true)
  );


export async function execute(interaction: ChatInputCommandInteraction) {
  console.log("Incident Append Command executed");
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  let thread: ThreadChannel
  if (interaction.member && !(interaction.member.roles as any).cache.has(incident_role_id)) {
      console.log("User has no permission to use this command.");
      await interaction.editReply({ content: 'Du hast keine Berechtigung, diesen Befehl zu verwenden.' });
      return;
  }

  let incident = db.get(`SELECT * FROM incidents WHERE id = ?`, [interaction.options.getInteger('incedentid')]) as any;
  console.log(incident);
  let allIncidents = db.all(`SELECT * FROM incidents`);
  console.log(allIncidents);
  if (!incident) {
      await interaction.editReply({ content: 'Incident nicht gefunden.' });
      console.log(incident);
      return;
  }
  let comment = interaction.options.getString('comment');
  if (incident.status === 'closed') {
    await interaction.reply({ content: 'Incident ist nicht offen.', flags: MessageFlags.Ephemeral });
    return;
  }
  if (incident.status === 'open') {
    console.log("Incident is open, adding comment.");
    let channel = interaction.guild?.channels.cache.get(incident_channel_id) as TextChannel;
    let message = channel?.messages.fetch(incident.messageid);
    if (message) {
      const fetchedMessage = await message;
      
      thread = await fetchedMessage.startThread({
        name: 'Incident - ' + incident.name,
        autoArchiveDuration: 60
      });
      let embed = new EmbedBuilder()
        .setColor('#FBE870')
        .setTitle('Kommentar-' + incident.appends)
        .setDescription(comment || 'Kein Kommentar angegeben')
        .setTimestamp(Date.now());
      (thread)?.send({ embeds: [embed] });  
    } else {
      await interaction.editReply({ content: 'Incident Nachricht nicht gefunden.' });
      return;
    }
  }
  if (incident.status === 'appended') {
    let channel = interaction.guild?.channels.cache.get(incident_channel_id) as TextChannel;
    let message = channel?.messages.fetch(incident.messageid);
    if (message) {
      const fetchedMessage = await message;
      
      thread = await fetchedMessage.startThread({
        name: 'Incident - ' + incident.name,
        autoArchiveDuration: 60
      });
        
      let embed = new EmbedBuilder()
        .setColor('#FBE870')
        .setTitle('Kommentar-' + incident.appends)
        .setDescription(comment || 'Kein Kommentar angegeben')
        .setTimestamp(Date.now());
      (thread)?.send({ embeds: [embed] });
    }
      
  }
}
