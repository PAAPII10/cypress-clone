"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { io as ClientIO } from "socket.io-client";
import { useSupabaseUser } from "./supabase-user-provider";

interface ISocketProviderProps {
  children: ReactNode;
}

type socketContextType = {
  socket: any | null;
  isConnected: boolean;
};

const SocketContext = createContext<socketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }: ISocketProviderProps) => {
  const { user } = useSupabaseUser();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  useEffect(() => {
    if (user) {
      const socketInstance = new (ClientIO as any)(process.env.WEB_SOCKET_URL, {
        transports: ["websocket"],
      });

      socketInstance.on("connect", () => {
        setIsConnected(true);
      });

      socketInstance.on("disconnect", () => {
        setIsConnected(false);
      });

      socketInstance.on("connect_error", async (err: any) => {
        console.log(`connect_error due to ${err.message}`);
        if (process.env.WEB_SOCKET_URL) {
          await fetch(process.env.WEB_SOCKET_URL);
        }
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
