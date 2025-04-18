import { errorLogger } from "../utils/LoggerUtils.js";
import jsonwebtoken from "jsonwebtoken";
import dotenv from 'dotenv';
dotenv.config();

class UserController {
    #userService
    #env
    constructor(userService) {
        this.#userService = userService;
        this.#env = process.env.APP_ENV === "production"
    }

    getUserByIdentifier = async (req, res) => {
        try {
            const { email, username } = req.query;
            if (!email && !username) return res.status(400).json({
                code: 400,
                message: "Invalid Request"
            });
            const response = await this.#userService.getUserByIdentifier(req.query);
            return res.status(response.code).json(response);
        }
        catch (error) {
            errorLogger("error", error.stack);
            return res.status(500).json({
                error: "Error while fetching user by identifier"
            });
        }
    }

    getUserById = async (req, res) => {
        try {
            const { id } = req.params;
            const response = await this.#userService.getUserById(id);
            return res.status(response.code).json(response);
        } catch (error) {
            errorLogger("error", error.stack);
            return res.status(500).json({
                error: "Error while fetching user by id"
            });
        }
    }

    getUsers = async (req, res) => {
        try {
            const response = await this.#userService.getUsers();
            return res.status(response.code).json(response);
        } catch (error) {
            errorLogger("error", error.stack);
            return res.status(500).json({
                error: "Error while fetching users"
            });
        }
    }

    createUser = async (req, res) => {
        try {
            const userData = req.body;
            const response = await this.#userService.createUser(userData);
            return res.status(response.code).json(response);
        } catch (error) {
            errorLogger("error", error.stack);
            return res.status(500).json({
                error: "Error while creating the user"
            });
        }
    }

    signIn = async (req, res) => {
        try {
            const userData = req.body;
            const response = await this.#userService.signIn(userData);
            const jwtToken = response.token;
            return res
                .cookie("token", jwtToken, {
                    httpOnly: true,
                    secure: false,
                    sameSite: "Lax",
                    maxAge: 1000 * 60 * 60,
                    path: "/",
                })
                .status(response.code)
                .json({
                    code: response.code,
                    message: response.message,
                    user: response.user,
                });
        } catch (error) {
            errorLogger("error", error.stack);
            return res.status(500).json({
                error: "Error while signing in."
            });
        }
    }

    signOut = async (req, res) => {
        try {
            let response = await this.#userService.signOut(res);
            return res.status(response.code).json(response);
        } catch (error) {
            errorLogger("error", error.stack);
            return res.status(500).json({ error: "Error while signing out." });
        }
    };

    deleteUser = async (req, res) => {
        try {
            let id = req.params.id;
            let response = await this.#userService.deleteUser(id, res);
            return res.status(response.code).json(response);
        } catch (error) {
            errorLogger("error", error.stack);
            return res.status(500).json({
                error: "Error while deleting user"
            });
        }
    }

    getUserValidationState = async (req, res) => {
        try {
            return res.status(200).json({
                "code": 200,
                "message": "Successful",
                "isUserValidated": true
            });
        } catch (error) {
            errorLogger("error", error.stack);
            return res.status(500).json({
                error: "Error while validating user"
            });
        }
    }
}

export default UserController;