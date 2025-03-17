import { defaultLogger, errorLogger, getResponseLogInput } from "./src/utils/LoggerUtils.js";
import usersRouter from "./src/routes/user.js";
import express from "express"
import dotenv from "dotenv"
import path from "path";
import cors from "cors";
import url from "url";
import { responseLogger } from "./src/utils/middlewares/logger.js";

try {
    const app = express();
    dotenv.config();
    const PORT = process.env.PORT;
    const CLIENT_URL = process.env.CLIENT_ORIGIN;
    app.use(cors({
        origin: CLIENT_URL,
        methods: ["GET", "POST", "DELETE", "PUT"],
        allowedHeaders: ["Content-Type", "Authorization"],
        exposedHeaders: ["Authorization"],
    }))
    app.use(responseLogger(getResponseLogInput, "info"));
    app.use(express.urlencoded({ extended: false }));
    app.use(express.raw());
    app.use(express.json());
    app.use(express.static(path.join(path.dirname(url.fileURLToPath(import.meta.url)), "public")));
    app.use("/users", usersRouter);
    app.use((req, res, next) => {
        return res.status(404).json({ message: "Route not found" });
    });
    app.listen(PORT, () => {
        defaultLogger("info", `Listening to requests on PORT:${PORT}`)
    });
} catch (error) {
    errorLogger("error", error.message);
}