import { NextApiResponseServerIo } from "@/lib/types";
import { Server as NetServer } from "http";
import { Server as ServerIO } from "socket.io";
import { NextApiRequest } from "next";

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIo) => {
  if (!res.socket.server.io) {
    const path = "/api/socket/io";
    const httpServer: NetServer = res.socket.server as any;
    const PORT = 3001;

    const io = new ServerIO({
      path,
      addTrailingSlash: false,
      cors: { origin: "*" },
    }).listen(3001);

    io.on("connect", (socket) => {
      const _socket = socket;
      console.log("socket connect", socket.id);
      _socket.broadcast.emit("welcome", `Welcome ${_socket.id}`);
      socket.on("disconnect", async () => {
        console.log("socket disconnect");
      });
    });

    io.on("connection", (s) => {
      s.on("create-room", (fileId) => {
        s.join(fileId);
      });
      s.on("send-changes", (deltas, fileId) => {
        s.to(fileId).emit("receive-changes", deltas, fileId);
      });
      s.on("send-cursor-move", (range, fileId, cursorId) => {
        s.to(fileId).emit("receive-cursor-move", range, fileId, cursorId);
      });
    });
    res.socket.server.io = io;
  }
  res.end();
};

export default ioHandler;
