import { io } from "socket.io-client"
import api from "./api.js"

const socket = io(api.defaults.baseURL, {
    autoConnect:true,
    withCredentials:true,
    reconnection:true,
    reconnectionDelay:1000,
    reconnectionDelayMax:5000,
    timeout:10000
});

export default socket;