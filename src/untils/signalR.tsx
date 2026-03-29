const BASE_URL = import.meta.env.VITE_API_URL;
import { useEffect, createContext, useRef, useState, useContext } from "react";
import * as signalR from "@microsoft/signalr";
import { useStore } from "../zustand/store";
export const SignalRContext = createContext<{
    connection: signalR.HubConnection | null;
} | null>(null);

export const useSignalR = () => {
    const context = useContext(SignalRContext);
    if (!context) return { connection: null };
    return context;
};

export const SignalRProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const setSignalRConnectionId = useStore((state) => state.setSignalRConnectionId);
    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const [connectionState, setConnectionState] = useState<signalR.HubConnection | null>(null);
    useEffect(() => {
        if (connectionRef.current) return;
        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${BASE_URL}/notifications`, {
                accessTokenFactory: () => localStorage.getItem("accessToken") || "",
            })
            .withAutomaticReconnect()
            .build();
        connectionRef.current = connection;
        setConnectionState(connection);

        connection
            .start()
            .then(() => {
                setSignalRConnectionId(connection.connectionId);
                console.log(connection.connectionId);
            })
            .catch((err) => console.error("SignalR Connection Error: ", err));

    }, [setSignalRConnectionId]);

    return (
        <SignalRContext.Provider value={{ connection: connectionState }}>
            {children}
        </SignalRContext.Provider>
    );
};
