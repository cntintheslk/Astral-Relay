const fs = require("fs");
const path = require("path");

module.exports = function loadModules(client) {
    const modulesPath = path.join(__dirname, "../modules");
    const modules = fs.readdirSync(modulesPath);

    for (const folder of modules) {
        const modulePath = path.join(modulesPath, folder, "module.js");

        if (!fs.existsSync(modulePath)) continue;

        const moduleFunc = require(modulePath);

        console.log(`[INFO]     [${folder}] Initializing ${folder} module...`);

        try {
            // Pass client properly
            moduleFunc(client);

            console.log(`[SUCCESS]  [module:${folder}] Initialized`);
        } catch (err) {
            console.error(`[ERROR] Module load failed for ${folder}:`, err);
        }
    }
};
