// ============================================================
// ASTRAL RELAY — DISCORD CLIENT FACTORY
// Responsible solely for constructing a configured Discord.js
// client instance. No side effects, no lifecycle control.
// ============================================================

const { Client, GatewayIntentBits, Partials } = require("discord.js");

// ------------------------------------------------------------
// INTENT DECLARATIONS
// Explicitly listed to ensure deliberate permission usage.
// Any additions here must be justified and documented.
// ------------------------------------------------------------
const INTENTS = [
    // Required for basic guild-level operation and slash commands
    GatewayIntentBits.Guilds,

    // Required for role assignment, approvals, and member workflows
    GatewayIntentBits.GuildMembers,

    // Required for command responses and system messages
    GatewayIntentBits.GuildMessages,

    // Required for reading message content where applicable
    GatewayIntentBits.MessageContent,
];

// ------------------------------------------------------------
// PARTIAL STRUCTURES
// Enables handling of uncached entities safely.
// ------------------------------------------------------------
const PARTIALS = [
    Partials.Channel,
    Partials.Message,
    Partials.GuildMember,
];

// ------------------------------------------------------------
// CLIENT FACTORY
// ------------------------------------------------------------

/**
 * Creates and returns a configured Discord.js Client instance.
 * This function performs no login or initialisation logic.
 */
function createClient() {
    const client = new Client({
        intents: INTENTS,
        partials: PARTIALS,
    });

    client.commands = new Collection();

    return client;
}


module.exports = createClient;
