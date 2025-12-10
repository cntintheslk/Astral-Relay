const { log } = require("../../core/discordLogger");
const { buildHealthEmbed } = require("./buildHealthEmbed");
const { getHealthMessageId, setHealthMessageId } = require("../../core/systemHealthStore");

let lastTick = Date.now();

async function startHealthJob(client, channel) {
    if (!channel) {
        log("ERROR", "Health Monitor Error", "Health monitor channel is missing — cannot start.");
        return;
    }

    // Load persisted message ID
    let healthMessageId = getHealthMessageId();

    log(
        "SUCCESS",
        "Health Monitor Started",
        "System health diagnostics are running every **15 seconds**."
    );

    setInterval(async () => {

        // -----------------------------------------------------
        // EVENT LOOP DELAY CHECK
        // -----------------------------------------------------
        const now = Date.now();
        const loopDelay = now - lastTick - 15000;
        lastTick = now;

        if (loopDelay > 1000) {
            log("ERROR", "Event Loop Stall", `Loop delayed by **${loopDelay}ms**.`);
        } else if (loopDelay > 300) {
            log("WARN", "Event Loop Delay", `Loop behind by **${loopDelay}ms**.`);
        }

        // -----------------------------------------------------
        // BUILD HEALTH PANEL EMBED
        // -----------------------------------------------------
        const embed = buildHealthEmbed(client);

        try {
            if (!healthMessageId) {
                // FIRST TIME — CREATE MESSAGE
                const msg = await channel.send({ embeds: [embed] });
                healthMessageId = msg.id;

                setHealthMessageId(msg.id); // Save to DB

                log("INFO", "Health Panel Created", `Health message ID: \`${msg.id}\``);

            } else {
                // UPDATE EXISTING EMBED
                await channel.messages.edit(healthMessageId, { embeds: [embed] });
            }

        } catch (err) {
            log(
                "ERROR",
                "Health Panel Update Failed",
                `Failed to send or update health embed.\n\`\`\`${err.message}\`\`\``
            );
        }

    }, 15000); // 15 sec interval
}

module.exports = { startHealthJob };
