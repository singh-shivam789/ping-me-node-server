import { defaultLogger, errorLogger } from "../LoggerUtils.js";
export const logValidatorInitializer = (logValidator, refreshInterval) => {
     try {
            defaultLogger("info", `Initializing ${logValidator.name}`);
            setInterval(logValidator, refreshInterval);
        } catch (error) {
            errorLogger("error", `Error while initializing ${logValidator.name}`);
            throw new Error(error.stack);
        }
    return (req, res, next) => {next()};
}