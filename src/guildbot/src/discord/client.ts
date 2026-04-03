import { Client, GatewayIntentBits } from "discord.js";
import type { Logger } from "../util/logger.js";
import type { CommandRouter } from "./command-router.js";

export function createDiscordClient(router: CommandRouter, logger: Logger): Client {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
  });

  client.once("ready", () => {
    logger.info("GuildBot online", { tag: client.user?.tag });
  });

  client.on("messageCreate", async (message) => {
    const response = await router.routeMessage(message);
    if (response) {
      await message.reply(response);
    }
  });

  return client;
}
