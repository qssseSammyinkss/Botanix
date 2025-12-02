const { logError } = require("../utils/logger");
const PREFIX = process.env.DISCORD_BOT_PREFIX || "!";
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
  name: "messageCreate",
  async execute(message) {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    if (MAINTENANCE_MODE) {
      let reply = "⚠️ The bot is currently under maintenance.";
      if (MAINTENANCE_TYPE === "timed" && maintenanceEndTime) {
        const remaining = Math.floor((maintenanceEndTime - Date.now()) / 1000);
        if (remaining > 0) reply += ` Time left: ${formatDuration(remaining)}.`;
      }

      // Delete user message after 10s
      setTimeout(() => message.delete().catch(() => {}), 10000);

      // Send ephemeral-like reply (using DM workaround)
      return message.author
        .send(reply)
        .catch(() => message.reply("⚠️ Bot under maintenance (could not DM)."));
    }

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = message.client.commands.get(commandName);

    if (!command) return;

    try {
      await command.execute(message, args);
    } catch (error) {
      logError(`❌ Error executing ${commandName} command: ${error}`);
      message.reply("There was an error while executing this command.");
    }
  },
};
