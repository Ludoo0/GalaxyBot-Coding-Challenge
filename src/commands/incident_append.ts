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
import { openDb } from "../db";
let db: any;
(async () => {
  db = await openDb();
})();

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
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  
  let thread: ThreadChannel
  if (interaction.member && !(interaction.member.roles as any).cache.has(incident_role_id)) {
      await interaction.editReply({ content: 'Du hast keine Berechtigung, diesen Befehl zu verwenden.' });
      return;
  }

  let incident: any = await db.get(`SELECT * FROM incidents WHERE id = ?`, [interaction.options.getInteger('incedentid')]);
  if (incident === undefined) {
    interaction.editReply({ content: 'Incident nicht gefunden.' });
    return;
  }
  let comment = interaction.options.getString('comment');
  if (incident.status === 'closed') {
    await interaction.editReply({ content: 'Incident ist nicht offen.'});
    return;
  }
  if (incident.status === 'open') {
    let channel = interaction.guild?.channels.cache.get(incident_channel_id) as TextChannel;
    let message = channel?.messages.fetch(incident.messageid);
    let incident_count;
    if (message) {
      const fetchedMessage = await message;
      
      thread = await fetchedMessage.startThread({
        name: 'Incident - ' + incident.name,
        autoArchiveDuration: 60
      });
      thread.setLocked(true);
      incident_count = 1;
      let embed = new EmbedBuilder()
        .setColor('#FBE870')
        .setTitle('Kommentar #' + incident_count)
        .setDescription(comment || 'Kein Kommentar angegeben')
        .setTimestamp(Date.now());
      (thread)?.send({ embeds: [embed] });  
    } else {
      await interaction.editReply({ content: 'Incident Nachricht nicht gefunden.' });
      return;
    }
    db.run(`UPDATE incidents SET appends = ${incident_count} WHERE id = ?`, [incident.id]);
    db.run(`UPDATE incidents SET status = 'appended' WHERE id = ?`, [incident.id]);
    interaction.editReply({ content: 'Kommentar hinzugefügt.' });
  }
  if (incident.status === 'appended') {
    let incident_count;
    let channel = interaction.guild?.channels.cache.get(incident_channel_id) as TextChannel;
    let message = channel?.messages.fetch(incident.messageid);
    if (message) {
      const fetchedMessage = await message;
      let thread = fetchedMessage.thread;

      incident_count = incident.appends + 1;
      let embed = new EmbedBuilder()
        .setColor('#FBE870')
        .setTitle('Kommentar #' + incident.appends)
        .setDescription(comment || 'Kein Kommentar angegeben')
        .setTimestamp(Date.now());
      (thread)?.send({ embeds: [embed] });
      db.run(`UPDATE incidents SET appends = ${incident_count} WHERE id = ?`, [incident.id]);
    }
      
  }
  if (incident.status === 'closed') {
    await interaction.editReply({ content: 'Incident ist geschlossen.' });
    return;
  }
}
