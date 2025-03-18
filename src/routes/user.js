import { errorLogger, getRequestLogInput, getResponseLogInput } from "../utils/LoggerUtils.js";
import { requestLogger, responseLogger } from "../utils/middlewares/logger.js";
import UserController from "../controller/UserController.js";
import { authorizer } from "../utils/middlewares/auth.js";
import UserService from "../service/UserService.js";
import express from "express";

const userService = new UserService();
const userController = new UserController(userService);
const usersRouter = express.Router();

try {
    usersRouter.get("/all", requestLogger(getRequestLogInput, "info"), authorizer, userController.getUsers);
    usersRouter.post("/signup", requestLogger(getRequestLogInput, "info"), userController.createUser);
    usersRouter.post("/signin", requestLogger(getRequestLogInput, "info"), userController.signIn);
    usersRouter.post("signout", requestLogger(getRequestLogInput, "info"), userController.signOut)
    usersRouter.get("/", requestLogger(getRequestLogInput, "info"), authorizer, userController.getUserByIdentifier);
    usersRouter.get("/:id", requestLogger(getRequestLogInput, "info"), authorizer, userController.getUserById);
    usersRouter.delete("/:id", requestLogger(getRequestLogInput, "info"), authorizer, userController.deleteUser);
    usersRouter.use((req, res) => {
        return res.status(404).json({ message: "Route not found" });
    });
} catch (error) {
    errorLogger("error", error.message);
}

export default usersRouter;