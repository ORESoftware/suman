/// <reference types="socket.io" />
import * as SocketServer from 'socket.io';
export declare const initializeSocketServer: (cb: Function) => void;
export declare const getSocketServer: () => SocketServer.Server;
