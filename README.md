# PingMe  
## A Real‑Time Chat App (Backend)

### Overview  
An Express + Socket.IO server providing:  
- JWT‑based auth (cookie‑stored tokens)  
- REST endpoints for users, friends, chats  
- Real‑time notifications & messaging via Socket.IO  
- MongoDB data layer with index tuning  
- Custom logging (levels, rotation, retention)

### Setup

1. **Clone & install deps**  
   ```bash
   git clone https://github.com/singh-shivam789/ping-me-node-server
   cd ping-me-node-server
   npm install
   ```

2. **Environment**
    Create a .env file at project root:

    ```bash
    PORT=3000
    SOCKET_PORT=5000
    DB_USER=YOUR_MONGO_DB_USER_NAME
    DB_PASSWORD=YOUR_MONGO_DB_PASSWORD
    DB_NAME=test
    SECRET=A SECRET KEY FOR JWT AUTH
    APP_ENV=development
    CLIENT_ORIGIN=http://localhost:5173
    JWT_SECRET=A JWT GENERATED SECRET

    ```

3. **Run**
    ```bash
    npm start
    ```

### **Architecture**

 - **Entry point**: index.js
    - Express HTTP server + Socket.IO server
    - Middleware: CORS, JSON parsing, static assets, cookie parsing
 - **Routes**
    - `/user` & `/users` → `UserController`
    - `/chats` → `ChatController`
 - **Controllers**
    - `UserController.js`: signup, signin, friend requests, remove friend
    - `ChatController.js`: fetch user’s chats
 - **Services**
    - `UserService.js`: business logic + MongoDB calls + fires socket events
    - `ChatService.js`: chat initialization, lookup, deletion
 - **Middleware**
    - `authorizer.js`: JWT validation on protected routes + Socket.IO handshake
    - `logger.js` : request/response logging
    - `logValidator.js`: file‐based log rotation & retention
 
### Database
- **MongoDB** (via official driver)
    - **Collections & Indexes**
        - `users`
            - Unique index on email
            - Index on friend‑request arrays
        - `chats`
            - Index on participants for fast lookup


### Real‑Time Flow

1. **Handshake**: Socket.IO middleware reads JWT from cookie → attaches `socket.userId`
2. Emit events in controllers when:
    - New user signs up
    - Friend request sent/accepted/rejected
    - Message sent or chat clicked
3. Backend emits → frontend dispatches to Zustand
4. Messages & reads also persist to MongoDB

### Logging (Advanced)
Custom logging system with:

1. **Log Levels**
    - `INFO`: startup, connections, requests
    - `WARN`: recoverable issues
    - `ERROR`: stack traces, failures
2. **File Rotation & Cleanup**
    - Daily log files are created in the format: `server-YYYY-MM-DD.log`
    - Next­-day logs move to `logs/transmitted/`
    - Cleanup deletes files older than 7 days

3. **Color‑coded Console Logs**
    - Based on **log level** & **HTTP method**
    - Only in development mode

4. **Log Storage**
    - Logs written to `.src/logs`
    - Both JSON and human‑readable lines

5. **Request/Response Logger**
    - Captures HTTP method, URL, headers, body, response time
    - Masks sensitive fields (passwords, tokens)

6. **Example Log Entries**

    ```bash
    [INFO]  [29/6/2025 | 04:36:21] User: 6856ab0a11885bb14ca115cb disconnected from socket: CuZMzKrrSPMq1If5AAAD
    [INFO]  [29/6/2025 | 04:36:21] [REQUEST] - GET  /user/validate
    [INFO]  [29/6/2025 | 04:36:21] [REQUEST] - GET  /users/all
    [ERROR] [29/6/2025 | 04:36:21] JsonWebTokenError: jwt must be provided
        at module.exports [as verify] (.../node_modules/jsonwebtoken/verify.js:60:17)
        at authorizer (.../middlewares/authorizer.js:9:22)
        at Layer.handle (.../node_modules/express/lib/router/layer.js:95:5)
        ...
    [INFO]  [29/6/2025 | 05:05:09] Socket.IO Client connected on id: _5aug3YihzFTwhF8AAAd
    [INFO]  [29/6/2025 | 05:05:09] User: 686079c7a10c38e64f0d04f2 joined on socket: _5aug3YihzFTwhF8AAAd
    ...

### Scripts
```
pm2 start ./index.js
``` 