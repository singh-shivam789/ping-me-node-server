import express from "express"
import dotenv from "dotenv"
import usersRouter from "./src/routes/user.js";
import path from "path";
import url from "url";
import cors from "cors";
const app = express();
dotenv.config();
const PORT = process.env.PORT;
app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Authorization"],
}))
app.use(express.urlencoded({ extended: false }));
app.use(express.raw());
app.use(express.json());
app.use(express.static(path.join(path.dirname(url.fileURLToPath(import.meta.url)), "public")));
app.use("/user", usersRouter);

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});


app.get("/", (req, res) => {
    return res.json({
        code: 200,
        message: "Successful!"
    });
});