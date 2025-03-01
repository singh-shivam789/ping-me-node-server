import path from "path";
import url from "url";
import dotenv from "dotenv"
import { createWriteStream } from "fs";
dotenv.config();
class Logger{
    #env = process.env.appEnv || "development";
    #filePath =  path.join(path.dirname(url.fileURLToPath(import.meta.url)), "..", "logs", `server-${new Date().toISOString().split("T")[0]}.log`);
    #ws = createWriteStream(this.#filePath, {flags: "a", encoding: "utf-8"});
    #loggerType
    constructor(loggerType){
        this.#loggerType = loggerType;
        this.log = this.#getLogger(this.#loggerType);
    }

    #getLogger(){
        if(this.#loggerType === "console") return this.#consoleLogger.bind(this);
        else if(this.#loggerType === "file") return this.#fileBasedLogger.bind(this);
        else return this.#consoleLogger.bind(this);
    }

    #consoleLogger(level, textInput){
       switch(level){
        case "info":
            console.info(textInput);
            break;
        case "warn":
            console.warn(textInput);
            break;
        case "debug":
            if(this.#env === "development"){
                console.debug(textInput);
            }
            break;
        case "error":
            console.error(textInput);
            break;
        default:
            console.log(textInput);
       }
    }

    #fileBasedLogger(textInput){
        this.#ws.write(textInput, () => {});
    }
};

export default Logger;