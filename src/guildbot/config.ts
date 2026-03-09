import dotenv from "dotenv";

dotenv.config();

export const config = {
  discordToken: process.env.DISCORD_TOKEN ?? "",
};
