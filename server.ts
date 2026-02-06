import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import { parse } from "url";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    const io = new Server(httpServer);

    // Make IO accessible globally for API routes
    (global as any).io = io;

    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        // Join user to their own room for notifications
        socket.on("join-user", (userId) => {
            if (userId) {
                socket.join(`user:${userId}`);
                console.log(`Socket ${socket.id} joined user:${userId}`);
            }
        });

        // Join specific rooms (chats, emergency channels)
        socket.on("join-room", (room) => {
            if (room) {
                socket.join(room);
                console.log(`Socket ${socket.id} joined room:${room}`);
            }
        });

        socket.on("leave-room", (room) => {
            if (room) {
                socket.leave(room);
            }
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });

    httpServer.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port} with Socket.IO`);
    });
});
