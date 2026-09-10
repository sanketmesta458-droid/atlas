import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 3000);
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

await app.prepare();
const server = createServer((request, response) => handler(request, response));
const io = new Server(server, { path: "/socket.io", cors: { origin: true } });

io.on("connection", (socket) => {
  socket.on("join-audio-room", (roomId) => {
    if (typeof roomId !== "string" || !/^[a-z0-9-]{12,64}$/i.test(roomId)) return;
    socket.join(roomId);
    socket.to(roomId).emit("audio-peer-joined");
  });
  socket.on("audio-signal", ({ roomId, signal }) => {
    if (typeof roomId !== "string" || !signal || !socket.rooms.has(roomId)) return;
    socket.to(roomId).emit("audio-signal", signal);
  });
});

server.listen(port, hostname, () => console.log(`Atlas + audio signaling listening on http://${hostname}:${port}`));
