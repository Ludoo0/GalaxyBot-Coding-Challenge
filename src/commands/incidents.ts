import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
  EmbedBuilder,
} from "discord.js";
import { openDb } from "../db";
let db: any;
(async () => {
  db = await openDb();
})();

export const data = new SlashCommandBuilder()
  .setName("incidents")
  .setDescription("Show all open incidents");

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  let incidents: any = await db.all(
    `SELECT * FROM incidents WHERE status = ?`,
    ["open"]
  );
  if (incidents.length === 0) {
    await interaction.editReply({
      content: "Es gibt keine offenen Incidents.",
    });
    return;
  }
  let embed = new EmbedBuilder()
    .setTitle("Offene Incidents")
    .setColor("#0099ff")
    .setTimestamp()
    .setFooter({ text: "Incident-Tracker" });
  incidents.forEach((incident: any) => {
    if (!incident.appends || incident.appends.length === 0) {
      embed.addFields({
        name: `Incident #${incident.id} - ${incident.name}`,
        value: incident.description + "\n" + `Letzter Append: kein Append`,
        inline: true,
      });
    } else {
      let lastAppend = incident.appends[incident.appends.length - 1];
      embed.addFields({
        name: `Incident #${incident.id}`,
        value:
          incident.description +
          "\n" +
          `Letzter Append: ${lastAppend.description}, <t:${lastAppend.timestamp}:R>`,
        inline: true,
      });
    }
  });
  await interaction.editReply({ embeds: [embed] });
}
