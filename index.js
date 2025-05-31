import { defaultLogger, errorLogger, getRequestLogInput, getResponseLogInput } from "./src/utils/LoggerUtils.js";
import { logFilesValidator, transmittedLogFilesValidator } from "./src/config/logValidators.js";
import { logValidatorInitializer } from "./src/utils/middlewares/logValidatorInitializer.js";
import { requestLogger, responseLogger } from "./src/utils/middlewares/logger.js";
import usersRouter from "./src/routes/users.js";
import userRouter from "./src/routes/user.js";
import cookieParser from "cookie-parser";
import express from "express";
import dotenv from "dotenv";
import cookie from "cookie";
import path from "path";
import cors from "cors";
import url from "url";
import jsonwebtoken from "jsonwebtoken";
import { createServer } from "http";
import { Server } from "socket.io";

try {
    dotenv.config();
    const app = express();
    const PORT = process.env.PORT;
    const CLIENT_URL = process.env.CLIENT_ORIGIN;
    const JWT_SECRET = process.env.JWT_SECRET;
    const userSocketMap = new Map();
    app.use(cors({
        origin: CLIENT_URL,
        methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
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
    const httpServer = createServer(app);
    const io = new Server(httpServer, {
        cors: {
            origin: CLIENT_URL,
            methods: ["GET", "POST"],
            credentials: true
        },
        transports: ["websocket", "polling"]
    });
    try {
        io.use((socket, next) => {
            try {
                const rawCookie = socket.handshake.headers.cookie || "";
                const { token } = cookie.parse(rawCookie);
                if (!token) {
                    return next(new Error("Authentication Error"));
                }
                const userId = jsonwebtoken.verify(token, JWT_SECRET).sub;
                socket.userId = userId;
                next();
            } catch (error) {
                errorLogger("error", "Socket Auth Error");
                return next(new Error("Authentication Error"));
            }
        })
        io.on("connection", socket => {
            defaultLogger("info", `Socket.IO Client connected on id: ${socket.id}`)
            app.set("io", io);
            app.set("userSocketMap", userSocketMap);
            const userId = socket.userId;
            if (userId) {
                userSocketMap.set(userId, socket.id);
                defaultLogger("info", `User: ${userId} joined on socket: ${socket.id}`);
            }
            socket.on("disconnect", () => {
                if (userId) {
                    defaultLogger("info", `User: ${userId} disconnected from socket: ${socket.id}`)
                    userSocketMap.delete(userId);
                }
            })
        });
    } catch (error) {
        errorLogger("error", error.message);
    }
    httpServer.listen(PORT, () => {
        defaultLogger("info", `Listening to requests on PORT:${PORT}`)
        app.use(logValidatorInitializer(logFilesValidator, 1000 * 60 * 60));
        app.use(logValidatorInitializer(transmittedLogFilesValidator, 1000 * 60 * 60 * 24));
    });
} catch (error) {
    errorLogger("error", error.stack);
}