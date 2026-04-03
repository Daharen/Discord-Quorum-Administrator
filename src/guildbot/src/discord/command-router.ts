import type { Message } from "discord.js";
import type { GovernanceCommandHandlers } from "../governance/command-handlers.js";

export class CommandRouter {
  constructor(
    private readonly governanceChannelId: string,
    private readonly adminRoleId: string,
    private readonly handlers: GovernanceCommandHandlers,
  ) {}

  async routeMessage(message: Message): Promise<string | null> {
    if (message.author.bot || message.channelId !== this.governanceChannelId || !message.guild) {
      return null;
    }

    const member = await message.guild.members.fetch(message.author.id);
    const eligibleAdminIds = message.guild.members.cache
      .filter((entry) => entry.roles.cache.has(this.adminRoleId))
      .map((entry) => entry.id)
      .sort();

    const ctx = {
      guildId: message.guild.id,
      channelId: message.channelId,
      authorId: message.author.id,
      messageId: message.id,
      eligibleAdminIds,
    };

    const parts = message.content.trim().split(/\s+/);
    if (parts[0] === "!propose" && parts[1] === "admin_add" && parts[2]) {
      return this.handlers.handlePropose(ctx, {
        actionType: "admin_add",
        targetDiscordUserId: parts[2],
      });
    }

    if (parts[0] === "!propose" && parts[1] === "admin_remove" && parts[2]) {
      return this.handlers.handlePropose(ctx, {
        actionType: "admin_remove",
        targetDiscordUserId: parts[2],
      });
    }

    if (parts[0] === "!vote" && parts[1] && (parts[2] === "yes" || parts[2] === "no")) {
      return this.handlers.handleVote(ctx, parts[1], parts[2]);
    }

    if (parts[0] === "!proposal" && parts[1]) {
      return this.handlers.handleProposal(parts[1]);
    }

    if (parts[0] === "!proposals") {
      return this.handlers.handleProposals();
    }

    if (parts[0] === "!expire") {
      return this.handlers.handleExpire(Date.now());
    }

    if (parts[0] === "!execute" && parts[1]) {
      return this.handlers.handleExecute(parts[1]);
    }

    if (!member.roles.cache.has(this.adminRoleId)) {
      return "Only admin-role members may issue governance commands.";
    }

    return "Unsupported governance command.";
  }
}
