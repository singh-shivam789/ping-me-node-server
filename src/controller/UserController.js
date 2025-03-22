import { errorLogger } from "../utils/LoggerUtils.js";
class UserController {
    #userService
    constructor(userService) {
        this.#userService = userService;
    }

    getUserByIdentifier = async (req, res) => {
        try {
            const { email, username } = req.query;
            if (!email && !username) throw new Error("Invalid request, email or username can't be empty");
            const identifier = email || username;
            const userResponse = await this.#userService.getUserByIdentifier(identifier);
            return res.status(200).json(userResponse);
        }
        catch (error) {
            errorLogger("error", error.stack);
            return res.status(500).json({
                message: error.message,
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
                message: error.message,
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
                message: error.message,
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
                message: error.message,
                error: "Error while creating the user"
            });
        }
    }

    signIn = async (req, res) => {
        try {
            const userData = req.body;
            const response = await this.#userService.signIn(userData);
            const jwtToken = response.token;
            return res.cookie(
                "token", jwtToken, {
                    "httpOnly": true
                }
            ).status(response.code).json({
                code: response.code,
                message: response.message
            });
        } catch (error) {
            errorLogger("error", error.stack);
            return res.status(500).json({
                message: error.message,
                error: "Error while signing in."
            });
        }
    }
    
    signOut = async (req, res) => {
        try {
            let response = await this.#userService.signOut(req);
            return res.status(response.code).json(response);
        } catch (error) {
            errorLogger("error", error.stack);
            return res.status(500).json({
                message: error.message,
                error: "Error while signing out."
            });
        }
    }

    deleteUser = async (req, res) => {
        try {
            let id = req.params.id;
            let response = await this.#userService.deleteUser(id, req);
            return res.status(response.code).json(response);
        } catch (error) {
            errorLogger("error", error.stack);
            return res.status(500).json({
                message: error.message,
                error: "Error while deleting user"
            });
        }
    }
}

export default UserController;