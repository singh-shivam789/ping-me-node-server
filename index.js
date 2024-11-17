import express from 'express'
import dotenv from 'dotenv'
import usersRouter from './config/routes/user.js';
import path from 'path';
import url from 'url';
import cors from 'cors';
import authRouter from './config/routes/auth.js';
const app = express();
dotenv.config();
const PORT = process.env.PORT;
app.use(cors())
app.use(express.urlencoded({ extended: false }));
app.use(express.raw());
app.use(express.json());
app.use(express.static(path.join(path.dirname(url.fileURLToPath(import.meta.url)), 'public')));
app.use('/user', usersRouter);

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});


app.get('/', (req, res) => {
    return res.json({
        code: 200,
        message: "Successful!"
    });
});