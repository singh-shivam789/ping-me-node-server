import { authorizer } from "../utils/middlewares/authorizer.js";
import UserController from "../controller/UserController.js";
import { errorLogger } from "../utils/LoggerUtils.js";
import upload from "../../src/config/fileUpload.js";
import UserService from "../service/UserService.js";
import express from "express";

const userService = new UserService();
const userController = new UserController(userService);
const userRouter = express.Router();

try {
    userRouter.get("/validate", authorizer, userController.getUserValidationState);
    userRouter.post("/signup", userController.createUser);
    userRouter.post("/onboard", authorizer, upload.single('pfp'), userController.onboardUser);
    userRouter.post("/signin", userController.signIn);
    userRouter.post("/signout", userController.signOut);
    userRouter.post("/friendRequest", authorizer, userController.sendFriendRequest);
    userRouter.post("/sendMessage", authorizer, userController.sendMessage);
    userRouter.patch("/friendRequest", authorizer, userController.updateFriendRequestStatus);
    userRouter.patch("/removeFriend", authorizer, userController.removeFriend);
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