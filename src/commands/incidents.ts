// Imports
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
  EmbedBuilder,
} from "discord.js";
// Data
import { openDb } from "../db";
let db: any;
(async () => {
  db = await openDb();
})();

// Slash Command Data
export const data = new SlashCommandBuilder()
  .setName("incidents")
  .setDescription("Show all open incidents");

// Command Handler
export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  let incidents: any = await db.all(
    `SELECT * FROM incidents WHERE status = ? OR status = ?`,
    ["open", "appended"]
  );
  // Check if there are any incidents
  if (incidents.length === 0) {
    await interaction.editReply({
      content: "Es gibt keine offenen Incidents.",
    });
    return;
  }
  // Build Embed
  let embed = new EmbedBuilder()
    .setTitle("Offene Incidents")
    .setColor("#0099ff")
    .setTimestamp()
    .setFooter({ text: "Incident-Tracker" });
  // Add Incidents to Embed
  incidents.forEach((incident: any) => {
    try {
      if (!incident.appends || incident.appends.length === 0) {
        embed.addFields({
          name: `Incident #${incident.id} - ${incident.name}`,
          value: "`"+incident.description + "`\n" + `Letzter Append: kein Append`,
          inline: true,
        });
      } else { 
        let lastAppend = JSON.parse(incident.appends)[JSON.parse(incident.appends).length - 1];
        let timestamp = Math.floor(lastAppend.timestamp / 1000);
        embed.addFields({
          name: `Incident #${incident.id} - ${incident.name}`,
          value:
            "`"+ incident.description +
            "`\n" +
            "Letzter Append: "+lastAppend.description+", <t:"+timestamp+":R>",
          inline: true,
        });
      }
    } catch (error) {
      console.error("Error while adding incident to embed:", error);
      interaction.editReply({
        content: "Fehler beim Hinzufügen des Incidents zur Embed-Nachricht.",
      });
    }
  });
  // Send Embed
  await interaction.editReply({ embeds: [embed] });
}
