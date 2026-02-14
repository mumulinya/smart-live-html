import { webSocketURL } from '@/utils/request';

export class ChatWebSocket {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.isConnecting = false;
        this.isAuthenticated = false;
        this.reconnectTimer = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.token = null;
        this.messageCallbacks = [];
        this.connectionCallbacks = [];
        this.authCallbacks = [];

        const explicitWsUrl = String(import.meta.env.VITE_WS_URL || '').trim();
        if (explicitWsUrl) {
            this.wsUrl = explicitWsUrl;
        } else {
            const hostOrUrl = String(webSocketURL || 'localhost').trim();
            const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss' : 'ws';
            this.wsUrl = /^wss?:\/\//i.test(hostOrUrl)
                ? hostOrUrl
                : `${protocol}://${hostOrUrl}:8888/ws`;
        }
        this.heartbeatTimer = null;
        this.heartbeatInterval = 30000;
        this.manuallyClosedSockets = new WeakSet();
    }

    connect(token) {
        if (!token) return;

        const current = this.ws;
        const sameToken = this.token === token;
        if (
            current &&
            sameToken &&
            (current.readyState === WebSocket.OPEN || current.readyState === WebSocket.CONNECTING)
        ) {
            return;
        }

        this.token = token;

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (current) {
            this.manuallyClosedSockets.add(current);
            try {
                current.close(1000, 'manual_reconnect');
            } catch (error) {
                console.error('Failed to close previous WebSocket:', error);
            }
            if (this.ws === current) {
                this.ws = null;
            }
            this.isConnected = false;
            this.isAuthenticated = false;
            this.stopHeartbeat();
        }

        console.log('Connecting WebSocket:', this.wsUrl);

        try {
            const socket = new WebSocket(this.wsUrl);
            this.ws = socket;
            this.isConnecting = true;

            socket.onopen = () => {
                if (this.ws !== socket) return;
                console.log('WebSocket connected');
                this.isConnecting = false;
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.notifyConnectionCallbacks('connected');
                this.sendAuthMessage();
                this.startHeartbeat();
            };

            socket.onmessage = (event) => {
                if (this.ws !== socket) return;
                try {
                    const message = JSON.parse(event.data);
                    this.handleServerMessage(message);
                } catch (error) {
                    console.error('Failed to parse message:', error);
                }
            };

            socket.onclose = (event) => {
                const isManualClose = this.manuallyClosedSockets.has(socket);
                this.manuallyClosedSockets.delete(socket);

                const isCurrentSocket = this.ws === socket;
                if (isCurrentSocket) {
                    this.ws = null;
                    this.isConnecting = false;
                    this.isConnected = false;
                    this.isAuthenticated = false;
                    this.stopHeartbeat();
                    this.notifyConnectionCallbacks('disconnected');
                    this.notifyAuthCallbacks('disconnected');
                }

                if (isManualClose) {
                    return;
                }

                if (!isCurrentSocket) {
                    return;
                }

                console.log('WebSocket closed:', event.code, event.reason);
                this.tryReconnect();
            };

            socket.onerror = (error) => {
                if (this.ws !== socket) return;
                console.error('WebSocket error:', error);
                this.notifyConnectionCallbacks('error');
            };
        } catch (error) {
            this.isConnecting = false;
            console.error('Failed to create WebSocket connection:', error);
        }
    }

    startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatTimer = setInterval(() => {
            if (this.ws && this.isConnected) {
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
            console.log('Sent auth message');
        }
    }

    handleServerMessage(message) {
        switch (message.type) {
            case 'AUTH_SUCCESS':
                console.log('Auth success');
                this.isAuthenticated = true;
                this.notifyAuthCallbacks('success', message.data);
                break;
            case 'AUTH_FAILED':
                console.error('Auth failed:', message.data);
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
                console.log('Pong');
                break;
            case 'ERROR':
                console.error('Server returned ERROR:', message.data);
                this.notifyMessageCallbacks(message);
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
            console.error('WebSocket not connected');
            return false;
        }
    }

    disconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.ws) {
            this.manuallyClosedSockets.add(this.ws);
            try {
                this.ws.close(1000, 'manual_disconnect');
            } catch (error) {
                console.error('Failed to close WebSocket:', error);
            }
            this.ws = null;
        }

        this.isConnecting = false;
        this.isConnected = false;
        this.isAuthenticated = false;
        this.stopHeartbeat();
    }

    tryReconnect() {
        if (this.reconnectTimer || this.isConnected || this.isConnecting) {
            return;
        }

        if (this.reconnectAttempts < this.maxReconnectAttempts && this.token) {
            this.reconnectAttempts++;
            const delay = Math.min(3000 * this.reconnectAttempts, 30000);
            console.log(`Reconnecting in ${delay / 1000}s... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            this.reconnectTimer = setTimeout(() => {
                this.reconnectTimer = null;
                this.connect(this.token);
            }, delay);
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
        this.dispatchMessageBound = (message) => this.dispatchMessage(message);
        this.hasBoundMessageDispatcher = false;
    }

    init(token) {
        if (!this.chatWebSocket) {
            this.chatWebSocket = new ChatWebSocket();
        }

        if (!this.hasBoundMessageDispatcher) {
            this.chatWebSocket.onMessage(this.dispatchMessageBound);
            this.hasBoundMessageDispatcher = true;
        }

        if (token) {
            const shouldReconnectForToken = this.chatWebSocket.token !== token;
            const shouldConnectByState = !this.chatWebSocket.isConnected && !this.chatWebSocket.isConnecting;
            if (shouldReconnectForToken || shouldConnectByState) {
                this.chatWebSocket.connect(token);
            }
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
