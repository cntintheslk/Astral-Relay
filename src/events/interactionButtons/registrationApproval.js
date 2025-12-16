// ============================================================
// ASTRAL RELAY — REGISTRATION APPROVAL BUTTON HANDLER
// Thin controller that delegates all logic to the service.
// ============================================================

const registrationApprovalService =
    require("../../services/registrationApprovalService");

module.exports = {
    async handle(interaction) {
        if (!interaction.isButton()) return;
        return registrationApprovalService.handle(interaction);
    },
};
