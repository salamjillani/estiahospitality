import { io } from 'socket.io-client';
import { getAuthToken } from '../utils/api';

// In websocketService.js
class WebSocketService {
  constructor() {
    this.subscribers = new Map();
    this.socket = null;
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    this.connected = false;
    this.authAttempts = 0;
    this.connectionPromise = null;
    this.reconnectTimeout = null; // Add timeout for controlled reconnection
  }

  connect() {
    if (this.connectionPromise) return this.connectionPromise;
    
    if (this.connected && this.socket?.connected) {
      return Promise.resolve(this.socket);
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      const token = getAuthToken();
      if (!token) {
        console.warn('WebSocket connection delayed - no auth token');
        this.reconnectTimeout = setTimeout(() => {
          this.connectionPromise = null;
          resolve(this.connect());
        }, 2000); // Increase delay to 2 seconds
        return;
      }

      try {
        if (this.socket) {
          this.socket.offAny();
          this.socket.disconnect();
        }

        this.socket = io(this.baseURL, {
          transports: ['websocket'],
          auth: { token },
          reconnection: true,
          reconnectionAttempts: 3, // Reduce reconnection attempts
          reconnectionDelay: 5000, // Increase delay to 5 seconds
          withCredentials: true,
          autoConnect: true,
        });

        this.socket.on('connect', () => {
          console.log('WebSocket connected:', this.socket.id);
          this.connected = true;
          this.authAttempts = 0;
          clearTimeout(this.reconnectTimeout); // Clear reconnect timeout
          
          const callbacks = this.subscribers.get('connect');
          if (callbacks) {
            callbacks.forEach(callback => callback());
          }
          
          resolve(this.socket);
          this.connectionPromise = null;
        });

        this.socket.on('disconnect', (reason) => {
          console.log('WebSocket disconnected:', reason);
          this.connected = false;
          
          const callbacks = this.subscribers.get('disconnect');
          if (callbacks) {
            callbacks.forEach(callback => callback(reason));
          }
          
          if (reason === 'io server disconnect') {
            this.reconnectTimeout = setTimeout(() => this.socket.connect(), 5000);
          }
        });

        this.socket.on('connect_error', (error) => {
          console.error('Connection error:', error.message);
          
          if (++this.authAttempts > 3) {
            reject(new Error('Failed to connect to WebSocket server after multiple attempts'));
            this.connectionPromise = null;
            clearTimeout(this.reconnectTimeout);
            return;
          }
          
          this.reconnectTimeout = setTimeout(() => {
            if (!this.connected) {
              this.socket.connect();
            }
          }, this.authAttempts * 5000);
        });

        this.socket.onAny((event, ...args) => {
          console.log(`Received event: ${event}`, args);
          try {
            const callbacks = this.subscribers.get(event);
            if (callbacks) {
              callbacks.forEach(callback => {
                try {
                  callback(...args);
                } catch (callbackError) {
                  console.error(`Error in callback for event ${event}:`, callbackError);
                }
              });
            }
          } catch (error) {
            console.error(`Error handling event ${event}:`, error);
          }
        });
      } catch (error) {
        console.error('WebSocket initialization error:', error);
        reject(error);
        this.connectionPromise = null;
      }
    });

    return this.connectionPromise;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
      this.connectionPromise = null;
      clearTimeout(this.reconnectTimeout); // Clear timeout on disconnect
    }
  }

  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event).add(callback);
    
    // If this is a socket.io event and we're connected, register it directly
    if (this.socket?.connected && !event.startsWith('connect') && !event.startsWith('disconnect')) {
      this.socket.on(event, callback);
    }
    
    return () => this.unsubscribe(event, callback);
  }

  unsubscribe(event, callback) {
    if (this.subscribers.has(event)) {
      const callbacks = this.subscribers.get(event);
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.subscribers.delete(event);
      }
      
      // Also remove the direct socket.io listener if connected
      if (this.socket) {
        this.socket.off(event, callback);
      }
    }
  }

  async emit(event, data) {
    try {
      // Make sure we're connected before emitting
      if (!this.socket || !this.connected) {
        await this.connect();
      }
      
      // Emit the event with the data
      return new Promise((resolve, reject) => {
        this.socket.emit(event, data, (response) => {
          if (response && response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
        
        // Set a timeout in case the server doesn't respond
        setTimeout(() => {
          resolve(); // Resolve anyway after timeout
        }, 5000);
      });
    } catch (error) {
      console.error(`Error emitting event ${event}:`, error);
      throw error;
    }
  }
}

export const websocketService = new WebSocketService();