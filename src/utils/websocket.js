import { minioURL } from '@/utils/request';

export class ChatWebSocket {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.isAuthenticated = false;
        this.reconnectTimer = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.token = null;
        this.messageCallbacks = [];
        this.connectionCallbacks = [];
        this.authCallbacks = [];

        let ip = 'localhost';
        this.wsUrl = `ws://${ip}:8888/ws`;
        this.heartbeatTimer = null;
        this.heartbeatInterval = 30000; // 30 seconds heartbeat
    }

    connect(token) {
        this.token = token;

        if (this.ws) {
            this.disconnect();
        }

        console.log('🔗 Connecting WebSocket:', this.wsUrl);

        try {
            this.ws = new WebSocket(this.wsUrl);

            this.ws.onopen = () => {
                console.log('✅ WebSocket connected');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.notifyConnectionCallbacks('connected');
                this.sendAuthMessage();
                this.startHeartbeat();
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleServerMessage(message);
                } catch (error) {
                    console.error('Failed to parsing message:', error);
                }
            };

            this.ws.onclose = (event) => {
                console.log('🔌 WebSocket closed:', event.code, event.reason);
                this.isConnected = false;
                this.isAuthenticated = false;
                this.stopHeartbeat();
                this.notifyConnectionCallbacks('disconnected');
                this.notifyAuthCallbacks('disconnected');
                this.tryReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                this.notifyConnectionCallbacks('error');
            };

        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
        }
    }

    startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatTimer = setInterval(() => {
            if (this.ws && this.isConnected) {
                // Send PING message
                const pingMessage = {
                    type: 'PING',
                    timestamp: Date.now()
                };
                this.ws.send(JSON.stringify(pingMessage));
            }
        }, this.heartbeatInterval);
    }

    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    sendAuthMessage() {
        if (this.token && this.isConnected) {
            const authMessage = {
                type: 'AUTH',
                data: { token: this.token },
                timestamp: Date.now()
            };
            this.ws.send(JSON.stringify(authMessage));
            console.log('🔐 Sent auth message');
        }
    }

    handleServerMessage(message) {
        switch (message.type) {
            case 'AUTH_SUCCESS':
                console.log('✅ Auth success');
                this.isAuthenticated = true;
                this.notifyAuthCallbacks('success', message.data);
                break;
            case 'AUTH_FAILED':
                console.error('❌ Auth failed:', message.data);
                this.isAuthenticated = false;
                this.notifyAuthCallbacks('failed', message.data);
                break;
            case 'NEW_MESSAGE':
            case 'MESSAGE_SENT':
            case 'SYSTEM_MESSAGE':
            case 'MESSAGE_STATUS_UPDATE':
                this.notifyMessageCallbacks(message);
                break;
            case 'PONG':
                console.log('❤️ Pong');
                break;
            case 'ERROR':
                console.error('❌ Server returned ERROR:', message.data);
                this.notifyMessageCallbacks(message); // Forward to UI to handle
                break;
            default:
                console.log('Unknown message type:', message.type);
        }
    }

    sendMessage(type, data) {
        if (this.ws && this.isConnected) {
            const message = { type, data, timestamp: Date.now() };
            this.ws.send(JSON.stringify(message));
            return true;
        } else {
            console.error('❌ WebSocket not connected or auth');
            return false;
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        this.isAuthenticated = false;
        this.stopHeartbeat();
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
    }

    tryReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts && this.token) {
            this.reconnectAttempts++;
            const delay = Math.min(3000 * this.reconnectAttempts, 30000);
            console.log(`Reconnecting in ${delay / 1000}s... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            this.reconnectTimer = setTimeout(() => this.connect(this.token), delay);
        } else {
            console.error('Max reconnect attempts reached');
            this.notifyConnectionCallbacks('failed');
        }
    }

    onMessage(callback) { this.messageCallbacks.push(callback); }
    onConnectionChange(callback) { this.connectionCallbacks.push(callback); }
    onAuthChange(callback) { this.authCallbacks.push(callback); }

    notifyMessageCallbacks(message) {
        this.messageCallbacks.forEach(callback => {
            try { callback(message); } catch (error) { console.error('Message callback error:', error); }
        });
    }

    notifyConnectionCallbacks(status) {
        this.connectionCallbacks.forEach(callback => {
            try { callback(status); } catch (error) { console.error('Connection callback error:', error); }
        });
    }

    notifyAuthCallbacks(status, data) {
        this.authCallbacks.forEach(callback => {
            try { callback(status, data); } catch (error) { console.error('Auth callback error:', error); }
        });
    }
}

class GlobalWebSocketManager {
    constructor() {
        this.chatWebSocket = null;
        this.messageCallbacks = new Map();
    }

    init(token) {
        if (!this.chatWebSocket) {
            this.chatWebSocket = new ChatWebSocket();
        }
        if (token && (!this.chatWebSocket.isConnected || this.chatWebSocket.token !== token)) {
            this.chatWebSocket.connect(token);
            this.chatWebSocket.onMessage((message) => this.dispatchMessage(message));
        }
        return this.chatWebSocket;
    }

    getWebSocket() { return this.chatWebSocket; }
    registerCallback(namespace, callback) { this.messageCallbacks.set(namespace, callback); }
    unregisterCallback(namespace) { this.messageCallbacks.delete(namespace); }

    dispatchMessage(message) {
        this.messageCallbacks.forEach((callback, namespace) => {
            try { callback(message); } catch (error) { console.error(`Message callback error [${namespace}]:`, error); }
        });
    }

    sendMessage(type, data) {
        return this.chatWebSocket ? this.chatWebSocket.sendMessage(type, data) : false;
    }
}

export const wsManager = new GlobalWebSocketManager();
