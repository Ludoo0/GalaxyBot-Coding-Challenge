// Imports
import {
  SlashCommandSubcommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  CommandInteractionOptionResolver,
  TextChannel,
  MessageFlags,
} from "discord.js";
// import { db } from '../db';
import { openDb } from "../../db";
let db: any;
(async () => {
  db = await openDb();
})();

// Variables
const incident_role_id = "1366759363863122010";
const incident_channel_id = "1366759335916474399";

export const data = new SlashCommandSubcommandBuilder()
  .setName("close")
  .setDescription("Schließt einen Incident")
  .addIntegerOption((option) =>
    option
      .setName("incidentid")
      .setDescription("ID des Incidents")
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  interaction.deferReply({ flags: MessageFlags.Ephemeral });

  if (
    !interaction.member ||
    !(interaction.member.roles as any).cache.has(incident_role_id)
  ) {
    await interaction.editReply({
      content: "Du hast keine Berechtigung, diesen Befehl zu verwenden.",
    });
    return;
  }
  const incidentid = (
    interaction.options as CommandInteractionOptionResolver
  ).getInteger("incidentid");
  let incident = await db.get(`SELECT * FROM incidents WHERE id = ?`, [
    incidentid,
  ]);
  if (!incident) {
    await interaction.editReply({ content: "Incident nicht gefunden!" });
    return;
  }
  if (incident.status === "closed") {
    await interaction.editReply({
      content: "Incident ist bereits geschlossen!",
    });
    return;
  }

  let channel = interaction.guild?.channels.cache.get(
    incident_channel_id
  ) as TextChannel;
  let message = await channel.messages.fetch(incident.messageid);
  let embed = new EmbedBuilder()
    .setColor("#008000")
    .setTitle(`Incident #${incident.id}- ${incident.name}`)
    .setDescription("Das Incident wurde geschlossen!")
    .addFields(
      {
        name: "Beschreibung",
        value: incident.description || "Keine Beschreibung angegeben",
      },
      { name: "Status", value: "Geschlossen" },
      {
        name: "Dauer",
        value: `${Math.floor(
          (Date.now() - incident.created_at) / 1000 / 60
        )} Minuten`,
      }
    )
    .setTimestamp(Date.now());
  await message.edit({ embeds: [embed] });
  await db.run(`UPDATE incidents SET status = "closed" WHERE id = ?`, [
    incidentid,
  ]);
}
