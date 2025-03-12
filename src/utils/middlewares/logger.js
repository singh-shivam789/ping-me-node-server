import ConsoleLogger from "../ConsoleLogger.js";
import FileLogger from "../FileLogger.js";
import dotenv from "dotenv"
dotenv.config();
const appEnv = process.env.APP_ENV;
const logger = appEnv === "development" ? new ConsoleLogger() : new FileLogger();
export default function log(getLogInput, level) {
    return function (req, res, next) {
        const logInput = getLogInput(req, res);
        logger.log(level, logInput);
        next();
    };
}