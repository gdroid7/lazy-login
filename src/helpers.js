const fs = require('fs');

class Helpers {
    static async makeOrIgnoreDIR(path) {
        if (!fs.existsSync(path)) {
            console.log(`[x] Creating directory for screenshots...`);
            fs.mkdirSync(path, {
                recursive: true
            });
        }
    }
}

module.exports = Helpers;