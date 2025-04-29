import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Antwortet mit Pong!');

export async function execute(interaction: ChatInputCommandInteraction) {
  const start = Date.now();
  await interaction.deferReply();
  const latency = Date.now() - start;
  await interaction.followUp('Pong!`' +latency + 'ms`');
}
