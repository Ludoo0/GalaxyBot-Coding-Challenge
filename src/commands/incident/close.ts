// Imports
import {
  SlashCommandSubcommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  CommandInteractionOptionResolver,
  TextChannel,
  MessageFlags,
} from "discord.js";

// Data
import { getSettings } from "../settings";
import { openDb } from "../../db";
let db: any;
(async () => {
  db = await openDb();
})();

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
  // Variables
  if (!interaction.guildId) {
    await interaction.editReply({ content: "Guild ID ist nicht verfügbar." });
    return;
  }
  const incident_channel_id: string = (await getSettings(interaction.guildId)).channel_id;
  const incident_role_id: string = (await getSettings(interaction.guildId)).role_id;

  if (
    !interaction.member ||
    !(interaction.member.roles as any).cache.has(incident_role_id)
  ) {
    await interaction.reply({
      content: "Du hast keine Berechtigung, diesen Befehl zu verwenden.",
    });
    return;
  }
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
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
  await interaction.editReply({
    content: `Incident #${incidentid} wurde geschlossen!`,
  });
}
