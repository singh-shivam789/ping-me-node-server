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
    usersRouter.post("/signup", userController.createUser);
    usersRouter.post("/signin", userController.signIn);
    usersRouter.post("signout", userController.signOut)
    usersRouter.get("/", authorizer, userController.getUserByIdentifier);
    usersRouter.get("/:id", authorizer, userController.getUserById);
    usersRouter.delete("/:id", authorizer, userController.deleteUser);
    usersRouter.use((req, res) => {
        return res.status(404).json({ message: "Route not found" });
    });
} catch (error) {
    errorLogger("error", error.stack);
}

export default usersRouter;