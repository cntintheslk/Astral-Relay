const express = require("express");
const crypto = require("crypto");
const { createInfoEmbed } = require("../core/embedStyles");

const router = express.Router();

const SECRET = process.env.GITHUB_WEBHOOK_SECRET;
const CHANGELOG_CHANNEL = process.env.BOT_CHANGELOGS;

// Verify GitHub signature
function verifySignature(req) {
    const signature = req.headers["x-hub-signature-256"];
    if (!signature) return false;

    const body = JSON.stringify(req.body);
    const hash = "sha256=" + crypto.createHmac("sha256", SECRET).update(body).digest("hex");

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(hash));
}

module.exports = (client) => {
    router.post("/github", express.json({ verify: (req, res, buf) => { req.rawBody = buf } }), async (req, res) => {

        if (!verifySignature(req)) {
            console.log("[Webhook] Invalid signature from GitHub");
            return res.status(401).send("Invalid signature");
        }

        const event = req.headers["x-github-event"];

        if (event === "release") {
            const release = req.body.release;

            const version = release.tag_name;
            const notes = release.body || "*No changelog provided*";
            const url = release.html_url;

            const embed = createInfoEmbed(
                `🚀 New Release: ${version}`,
                `${notes}\n\n[View on GitHub](${url})`
            ).setTimestamp();

            const channel = client.channels.cache.get(CHANGELOG_CHANNEL);
            if (channel) {
                await channel.send({ embeds: [embed] });
                console.log(`[Webhook] Posted release ${version} to Discord`);
            } else {
                console.log("[Webhook] Changelog channel not found.");
            }
        }

        res.status(200).send("OK");
    });

    return router;
};
