import { authorizer } from "../utils/middlewares/authorizer.js";
import UserController from "../controller/UserController.js";
import { errorLogger } from "../utils/LoggerUtils.js";
import UserService from "../service/UserService.js";
import express from "express";

const userService = new UserService();
const userController = new UserController(userService);
const userRouter = express.Router();

try {
    userRouter.get("/validate", authorizer, userController.getUserValidationState);
    userRouter.post("/signup", userController.createUser);
    userRouter.post("/signin", userController.signIn);
    userRouter.post("/signout", userController.signOut);
    userRouter.get("/", authorizer, userController.getUserByIdentifier);
    userRouter.get("/:id", authorizer, userController.getUserById);
    userRouter.delete("/:id", authorizer, userController.deleteUser);
    userRouter.use((req, res) => {
        return res.status(404).json({ message: "Route not found" });
    });
} catch (error) {
    errorLogger("error", error.stack);
}

export default userRouter;