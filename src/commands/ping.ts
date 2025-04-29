// Imports
import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

// Data
export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Antwortet mit Pong!");

// Command Handler
export async function execute(interaction: ChatInputCommandInteraction) {
  const start = Date.now();
  await interaction.deferReply();
  const latency = Date.now() - start;
  await interaction.followUp("Pong!`" + latency + "ms`");
}
