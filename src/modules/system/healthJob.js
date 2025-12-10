// modules/system/healthJob.js
const { log } = require("../../core/discordLogger");
const { buildHealthEmbed } = require("./buildHealthEmbed");

let healthMessageId = null;
let lastTick = Date.now();

/**
 * Starts the health monitoring job.
 * Runs every 15 seconds.
 * Logs event loop delays and health update errors to Discord.
 */
function start(client, channel) {
    if (!channel) {
        log("ERROR", "Health Monitor Error", "Health monitor channel is missing — cannot start.");
        return;
    }

    log(
        "SUCCESS",
        "Health Monitor Started",
        "System health diagnostics are running every **15 seconds**."
    );

    setInterval(async () => {

        // -------------------------------------
        // EVENT LOOP DELAY MONITORING
        // -------------------------------------
        const now = Date.now();
        const loopDelay = now - lastTick - 15000;
        lastTick = now;

        if (loopDelay > 1000) {
            log(
                "ERROR",
                "Event Loop Stall Detected",
                `The event loop is **${loopDelay}ms** behind schedule — possible freeze.`
            );
        } else if (loopDelay > 300) {
            log(
                "WARN",
                "Event Loop Delay",
                `Event loop running **${loopDelay}ms** slower than expected.`
            );
        }

        // -------------------------------------
        // HEALTH EMBED UPDATE
        // -------------------------------------
        const embed = buildHealthEmbed(client);

        try {
            if (!healthMessageId) {
                // First-time posting of the health embed
                const msg = await channel.send({ embeds: [embed] });
                healthMessageId = msg.id;

                log(
                    "INFO",
                    "Health Message Created",
                    `New system health panel initialized.\nMessage ID: \`${healthMessageId}\``
                );
            } else {
                // Update the existing message
                await channel.messages.edit(healthMessageId, { embeds: [embed] });
            }

        } catch (err) {
            log(
                "ERROR",
                "Health Panel Update Failed",
                `Failed to send or edit health embed.\n\`\`\`${err.message}\`\`\``
            );
        }

    }, 15000); // 15 seconds
}

module.exports = { start };
