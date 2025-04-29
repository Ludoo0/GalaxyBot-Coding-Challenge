// Imports
import fs from "node:fs";
import path from "node:path";
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

const commandsPath = path.join(__dirname);
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file !== "index.ts" && file.endsWith(".ts"));

export let commands: Command[] = [];

export async function loadCommands() {
  const entries = fs.readdirSync(__dirname, { withFileTypes: true });
  const loaded: Command[] = [];

  for (const entry of entries) {
    let filePath: string;
    if (
      entry.isFile() &&
      entry.name.endsWith(".ts") &&
      entry.name !== "index.ts"
    ) {
      filePath = path.join(__dirname, entry.name);
    } else if (entry.isDirectory()) {
      const subIndex = path.join(__dirname, entry.name, "index.ts");
      if (fs.existsSync(subIndex)) {
        filePath = subIndex;
      } else {
        continue;
      }
    } else {
      continue;
    }

    const commandModule = await import(filePath);
    if ("data" in commandModule && "execute" in commandModule) {
      loaded.push({
        data: commandModule.data,
        execute: commandModule.execute,
      });
    }
  }

  commands = loaded;
}
