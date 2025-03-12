import path from "path";
import url from "url";
import dotenv from "dotenv"
import fs from "fs-extra";
dotenv.config();
const logsDir = path.join(
    path.dirname(url.fileURLToPath(import.meta.url)),
    "..",
    "logs"
);
fs.ensureDirSync(logsDir);

class Logger {
    #env = process.env.APP_ENV || "development";
    #filePath = path.join(logsDir, `server-${new Date().toISOString().split("T")[0]}.log`);
    #ws = fs.createWriteStream(this.#filePath, { flags: "a", encoding: "utf-8" });
    #loggerType
    constructor(loggerType) {
        this.#loggerType = loggerType;
        this.log = this.#getLogger(this.#loggerType);
    }

    #getLogger() {
        if (this.#loggerType === "console") return this.#consoleLogger.bind(this);
        else if (this.#loggerType === "file") return this.#fileBasedLogger.bind(this);
        else return this.#consoleLogger.bind(this);
    }

    #consoleLogger(level, textInput) {
        const formattedMessage = `${JSON.stringify(textInput)}`;

        switch (level) {
            case "info":
                console.info(formattedMessage);
                break;
            case "warn":
                console.warn(formattedMessage);
                break;
            case "debug":
                if (this.#env === "development") {
                    console.debug(formattedMessage);
                }
                break;
            case "error":
                console.error(formattedMessage);
                break;
            default:
                console.log(formattedMessage);
        }
    }

    #fileBasedLogger(level, textInput) {
        const formattedMessage = `${JSON.stringify(textInput)}\n`;
        this.#ws.write(formattedMessage, () => { });
    }
};

export default Logger;