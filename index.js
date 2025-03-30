import { defaultLogger, errorLogger, getRequestLogInput, getResponseLogInput } from "./src/utils/LoggerUtils.js";
import { logFilesValidator, transmittedLogFilesValidator } from "./src/config/logValidators.js";
import { logValidatorInitializer } from "./src/utils/middlewares/logValidatorInitializer.js";
import { requestLogger, responseLogger } from "./src/utils/middlewares/logger.js";
import usersRouter from "./src/routes/users.js";
import userRouter from "./src/routes/user.js";
import cookieParser from "cookie-parser";
import express from "express"
import dotenv from "dotenv"
import path from "path";
import cors from "cors";
import url from "url";

try {
    dotenv.config();
    const app = express();
    const PORT = process.env.PORT;
    const CLIENT_URL = process.env.CLIENT_ORIGIN;
    app.use(cors({
        origin: CLIENT_URL,
        methods: ["GET", "POST", "DELETE", "PUT"],
        allowedHeaders: ["Content-Type", "Authorization"],
        exposedHeaders: ["Authorization"],
        credentials: true
    }));
    app.use(cookieParser());
    app.use(responseLogger(getResponseLogInput, "info"));
    app.use(requestLogger(getRequestLogInput, "info"));
    app.use(express.urlencoded({ extended: false }));
    app.use(express.raw());
    app.use(express.json());
    app.use(express.static(path.join(path.dirname(url.fileURLToPath(import.meta.url)), "public")));
    app.use("/user", userRouter);
    app.use("/users", usersRouter);
    app.use((req, res, next) => {
        res.status(404).json({ message: "Route not found" });
        next();
    });
    app.listen(PORT, () => {
        defaultLogger("info", `Listening to requests on PORT:${PORT}`)
        app.use(logValidatorInitializer(logFilesValidator, 1000 * 60 * 60));
        app.use(logValidatorInitializer(transmittedLogFilesValidator, 1000 * 60 * 60 * 24));
    });
} catch (error) {
    errorLogger("error", error.stack);
}