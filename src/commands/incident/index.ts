import { SlashCommandBuilder } from "discord.js";
import * as fs from "fs";
import * as path from "path";

const data = new SlashCommandBuilder()
  .setName("incident")
  .setDescription("Incident commands");

const subcommandsPath = __dirname;
const subcommandFiles = fs
  .readdirSync(subcommandsPath)
  .filter((file) => file.endsWith(".ts") && file !== "index.ts");

const executeMap: Record<string, Function> = {};

for (const file of subcommandFiles) {
  const filePath = path.join(subcommandsPath, file);
  const subcommand = require(filePath);
  if ("data" in subcommand && "execute" in subcommand) {
    data.addSubcommand((sub) => subcommand.data);
    executeMap[subcommand.data.name] = subcommand.execute;
  }
}

export { data };

export async function execute(interaction: any) {
  const sub = interaction.options.getSubcommand();
  if (executeMap[sub]) {
    await executeMap[sub](interaction);
  } else {
    await interaction.reply({
      content: "Unbekannter Subcommand.",
      ephemeral: true,
    });
  }
}
