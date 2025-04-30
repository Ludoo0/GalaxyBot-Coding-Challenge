// Imports
import { Client, GatewayIntentBits, MessageFlags, Interaction } from "discord.js";
import dotenv from "dotenv";
import { commands, loadCommands } from "./commands/";

// Data
import { openDb } from "./db";
let db: any;
(async () => {
  db = await openDb();
})();

dotenv.config();

// Client
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Online-Event
client.once("ready", async () => {
  console.log(`${client.user?.tag} ist eingeloggt!`);

  //   Register Commands
  await loadCommands();
  const slashCommands = commands.map((cmd) => cmd.data.toJSON());
  await client.application?.commands.set(slashCommands);

  // Log registered commands
  console.log(
    "Slash-Commands registriert:",
    commands.map((cmd) => cmd.data.name).join(", ")
  );

  // Create Database Table
  await db.run(
    `CREATE TABLE IF NOT EXISTS incidents(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT NOT NULL, messageid TEXT NOT NULL, status TEXT CHECK( status IN ('open', 'appended', 'closed') ) NOT NULL, created_at TIMESTAMP NOT NULL, appends TEXT)`
  );
});

// Command-Handler
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = commands.find(
    (cmd) => cmd.data.name === interaction.commandName
  );
  if (!command) {
    await interaction.reply({
      content: "Unbekannter Command ",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    if (interaction.isChatInputCommand()) {
      await command.execute(interaction);
    } else {
      await interaction.reply({
        content: "Dieser Command wird nicht unterstützt.",
        flags: MessageFlags.Ephemeral
      });
    }
  } catch (err) {
    console.error(err);
    await interaction.editReply({
      content: "Fehler beim Ausführen des Befehls.",
    });
  }
});

// Login
module.exports = db;
client.login(process.env.BOT_TOKEN);
