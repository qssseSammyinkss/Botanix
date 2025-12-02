const { logError } = require("../utils/logger");
const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === "true";
const MAINTENANCE_TYPE = process.env.MAINTENANCE_TYPE || "permanent";
const MAINTENANCE_DURATION = parseInt(process.env.MAINTENANCE_DURATION) || 0;

let maintenanceEndTime =
  MAINTENANCE_MODE && MAINTENANCE_TYPE === "timed"
    ? Date.now() + MAINTENANCE_DURATION * 1000
    : null;

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  let parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(" ");
}

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (MAINTENANCE_MODE) {
      let reply = "⚠️ The bot is currently under maintenance.";
      if (MAINTENANCE_TYPE === "timed" && maintenanceEndTime) {
        const remaining = Math.floor((maintenanceEndTime - Date.now()) / 1000);
        if (remaining > 0) reply += ` Time left: ${formatDuration(remaining)}.`;
      }

      return interaction.reply({ content: reply, flags: 64 }); // ephemeral
    }

    // Slash commands
    if (interaction.isCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) {
        return interaction.reply({ content: "❌ Command not recognized!", flags: 64 });
      }
      try {
        await command.execute(interaction);
      } catch (error) {
        logError(`❌ Error executing ${interaction.commandName}: ${error}`);
        await interaction.reply({ content: "There was an error executing this command!", flags: 64 });
      }
      return;
    }

    // Context menu
    if (interaction.isUserContextMenuCommand() || interaction.isMessageContextMenuCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) {
        return interaction.reply({ content: "❌ Context command not recognized!", flags: 64 });
      }
      try {
        await command.execute(interaction);
      } catch (error) {
        logError(`❌ Error executing ${interaction.commandName}: ${error}`);
        await interaction.reply({ content: "There was an error executing this context command!", flags: 64 });
      }
      return;
    }
  },
};
