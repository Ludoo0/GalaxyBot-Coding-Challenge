// Imports
import {
    SlashCommandSubcommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    MessageFlags,
    ChannelType,
  } from "discord.js";

// Data
import { openDb } from "../db";
let db: any;
(async () => {
  db = await openDb();
})();

//  Slash Command Data
export const data = new SlashCommandSubcommandBuilder()
  .setName("settings")
  .setDescription("Stellt die Einstellungen des Bots ein")
  .addRoleOption((option) =>
    option
      .setName("incidentrole")
      .setDescription("Rolle, die benötigt wird, um Incidents zu verwalten")
      .setRequired(true)
  )
  .addChannelOption((option) =>
    option
      .setName("incidentchannel")
      .setDescription("Channel, in dem die Incidents erstellt werden")
      .setRequired(true)
  )

// Command Handler
export async function execute(interaction: ChatInputCommandInteraction) {
    if (interaction.user.id !== interaction.guild?.ownerId && !["171984500480409603", "1125106522154881034"].includes(interaction.user.id)) {
        await interaction.reply({
            content: "Du hast keine Berechtigung, diesen Befehl zu verwenden.",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    let incident_role_id = interaction.options.getRole("incidentrole")?.id;
    let incident_channel_id = interaction.options.getChannel("incidentchannel")?.id;
    if (interaction.options.getChannel("incidentchannel")?.type !== ChannelType.GuildText) {
        await interaction.editReply({
            content: "Der Channel muss ein Text-Channel sein.",
        });
        return;
    }
    await db.run(
        `INSERT OR REPLACE INTO settings(guild_id, role_id, channel_id) VALUES(?, ?, ?)`, [interaction.guildId, incident_role_id, incident_channel_id]
    );
    await interaction.editReply({
        content: "Die Einstellungen wurden erfolgreich gespeichert.",
    });
}

// Get Settings
export async function getSettings(guildId: string) {
    const settings = await db.get(
        `SELECT * FROM settings WHERE guild_id = ?`,
        [guildId]
    );
    return settings;
}