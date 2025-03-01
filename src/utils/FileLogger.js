import Logger from "./Logger.js";

class FileLogger extends Logger {
    static loggerInstance = null;
    loggerType = "file";
    constructor(){
        super("file");
        if(FileLogger.loggerInstance){
            return FileLogger.loggerInstance;
        }
        else{
            FileLogger.loggerInstance = this;
        }
    }
}

export default FileLogger;