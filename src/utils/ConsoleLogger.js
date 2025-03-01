import Logger from "./Logger.js";

class ConsoleLogger extends Logger {
    static loggerInstance = null;
    loggerType = "console";
    constructor(){
        super("console");
        if(ConsoleLogger.loggerInstance){
            return ConsoleLogger.loggerInstance;
        }
        else{
            ConsoleLogger.loggerInstance = this;
        }
    }
}

export default ConsoleLogger;