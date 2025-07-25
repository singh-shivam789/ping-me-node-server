import { authorizer } from "../utils/middlewares/authorizer.js";
import UserController from "../controller/UserController.js";
import { errorLogger } from "../utils/LoggerUtils.js";
import UserService from "../service/UserService.js";
import express from "express";

const userService = new UserService();
const userController = new UserController(userService);
const usersRouter = express.Router();

try {
    usersRouter.get("/all", authorizer, userController.getUsers);
    usersRouter.post("/by-email", authorizer, userController.getUsersByEmail);
    usersRouter.use((req, res) => {
        return res.status(404).json({ message: "Route not found" });
    });
} catch (error) {
    errorLogger("error", error.stack);
}

export default usersRouter;