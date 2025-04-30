// Imports
import {
  SlashCommandSubcommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  TextChannel,
  MessageFlags,
  ThreadChannel,
} from "discord.js";


// Data
import { getSettings } from "../settings";
import { openDb } from "../../db";
let db: any;
(async () => {
  db = await openDb();
})();

// Slash Command Data
export const data = new SlashCommandSubcommandBuilder()
  .setName("append")
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

// Command Handler
export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  // Variables
  if (!interaction.guildId) {
    await interaction.editReply({ content: "Guild ID ist nicht verfügbar." });
    return;
  }
  const incident_channel_id: string = (await getSettings(interaction.guildId)).channel_id;
  const incident_role_id: string = (await getSettings(interaction.guildId)).role_id;


  let thread: ThreadChannel;
  if (
    interaction.member &&
    !(interaction.member.roles as any).cache.has(incident_role_id)
  ) {
    await interaction.editReply({
      content: "Du hast keine Berechtigung, diesen Befehl zu verwenden.",
    });
    return;
  }

  let incident: any = await db.get(`SELECT * FROM incidents WHERE id = ?`, [
    interaction.options.getInteger("incedentid"),
  ]);
  if (incident === undefined) {
    interaction.editReply({ content: "Incident nicht gefunden." });
    return;
  }
  let comment = interaction.options.getString("comment");
  if (incident.status === "closed") {
    await interaction.editReply({ content: "Incident ist nicht offen." });
    return;
  }
  if (incident.status === "open") {
    let channel = interaction.guild?.channels.cache.get(
      incident_channel_id
    ) as TextChannel;
    let message = channel?.messages.fetch(incident.messageid);
    let incident_count;
    if (message) {
      const fetchedMessage = await message;
      if (!fetchedMessage.thread){
        thread = await fetchedMessage.startThread({
          name: "Incident - " + incident.name,
          autoArchiveDuration: 60,
        });
        thread.setLocked(true);
      } else {
        thread = fetchedMessage.thread;
      }
      
      incident_count = 1;
      let embed = new EmbedBuilder()
        .setColor("#FBE870")
        .setTitle("Kommentar #" + incident_count)
        .setDescription(comment || "Kein Kommentar angegeben")
        .setTimestamp(Date.now());
      thread?.send({ embeds: [embed] });
    } else {
      await interaction.editReply({
        content: "Incident Nachricht nicht gefunden.",
      });
      return;
    }
    let appends = [{ description: comment, timestamp: Date.now() }];
    let append_string = JSON.stringify(appends);
    db.run(`UPDATE incidents SET appends = ? WHERE id = ?`, [
      append_string,
      incident.id,
    ]);
    db.run(`UPDATE incidents SET status = 'appended' WHERE id = ?`, [
      incident.id,
    ]);
    interaction.editReply({ content: "Kommentar hinzugefügt." });
  }
  if (incident.status === "appended") {
    let channel = interaction.guild?.channels.cache.get(
      incident_channel_id
    ) as TextChannel;
    let message = channel?.messages.fetch(incident.messageid);
    if (message) {
      const fetchedMessage = await message;
      let append_count = JSON.parse(incident.appends).length + 1;
      let thread = fetchedMessage.thread;
      let embed = new EmbedBuilder()
        .setColor("#FBE870")
        .setTitle("Kommentar #" + append_count)
        .setDescription(comment || "Kein Kommentar angegeben")
        .setTimestamp(Date.now());
      thread?.send({ embeds: [embed] });
      let appends = JSON.parse(incident.appends);
      appends.push({ description: comment, timestamp: Date.now() });
      let append_string = JSON.stringify(appends);
      db.run(`UPDATE incidents SET appends = ? WHERE id = ?`, [
        append_string,
        incident.id,
      ]);
      interaction.editReply({ content: "Kommentar hinzugefügt." });
    }
  }
  if (incident.status === "closed") {
    await interaction.editReply({ content: "Incident ist geschlossen." });
    return;
  }
}
