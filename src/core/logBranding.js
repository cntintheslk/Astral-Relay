// ============================================================
// ASTRAL RELAY — LOGGING BRANDING
// Centralised visual identity for all logging embeds.
// ============================================================

module.exports = {
    NAME: "Astral Relay",

    // Discord attachment URL (uploaded once to a channel)
    LOGO_URL: "https://media.discordapp.net/attachments/1448193668728225813/1448193725611380837/Astral_Relay_-_Logo.png?format=webp&quality=lossless",

    FOOTER: "Astral Relay • System Log",

    /**
     * Apply Astral Relay branding to an EmbedBuilder
     */
    apply(embed) {
        embed.setAuthor({
            name: this.NAME,
            iconURL: this.LOGO_URL,
        });

        embed.setThumbnail(this.LOGO_URL);
        embed.setFooter({ text: this.FOOTER });

        return embed;
    },
};
