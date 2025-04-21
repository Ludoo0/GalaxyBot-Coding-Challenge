import fs from 'node:fs';
import path from 'node:path';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

const commandsPath = path.join(__dirname);
const commandFiles = fs.readdirSync(commandsPath).filter(file => file !== 'index.ts' && file.endsWith('.ts'));

export const commands: Command[] = [];

(async () => {
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const commandModule = await import(filePath);
    if ('data' in commandModule && 'execute' in commandModule) {
      commands.push({
        data: commandModule.data,
        execute: commandModule.execute,
      });
    } else {
      console.warn(`[WARN] Die Datei "${file}" exportiert kein gültiges Command-Objekt.`);
    }
  }
})();
