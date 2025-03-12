import { io } from 'socket.io-client';
import { getAuthToken } from '../utils/api';

class WebSocketService {
  constructor() {
    this.subscribers = new Map();
    this.socket = null;
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    this.connected = false;
    this.authAttempts = 0;
    this.connectionPromise = null;
  }

  connect() {
    // Return existing connection promise if already connecting
    if (this.connectionPromise) return this.connectionPromise;
    
    // Return immediately if already connected
    if (this.connected && this.socket?.connected) {
      return Promise.resolve(this.socket);
    }

    // Create a new connection promise
    this.connectionPromise = new Promise((resolve, reject) => {
      const token = getAuthToken();
      if (!token) {
        console.warn('WebSocket connection delayed - no auth token');
        setTimeout(() => {
          this.connectionPromise = null;
          resolve(this.connect());
        }, 1000);
        return;
      }

      try {
        // Clean up any existing socket
        if (this.socket) {
          this.socket.offAny();
          this.socket.disconnect();
        }

        this.socket = io(this.baseURL, {
          transports: ['websocket'],
          auth: { token },
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 3000,
          withCredentials: true,
          autoConnect: true,
        });

        // Connection handlers
        this.socket.on('connect', () => {
          console.log('WebSocket connected:', this.socket.id);
          this.connected = true;
          this.authAttempts = 0;
          
          // Notify all 'connect' subscribers
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
          
          // Notify all 'disconnect' subscribers
          const callbacks = this.subscribers.get('disconnect');
          if (callbacks) {
            callbacks.forEach(callback => callback(reason));
          }
          
          if (reason === 'io server disconnect') {
            setTimeout(() => this.socket.connect(), 1000);
          }
        });

        this.socket.on('connect_error', (error) => {
          console.error('Connection error:', error.message);
          
          if (++this.authAttempts > 5) {
            reject(new Error('Failed to connect to WebSocket server after multiple attempts'));
            this.connectionPromise = null;
            return;
          }
          
          setTimeout(() => {
            if (!this.connected) {
              this.socket.connect();
            }
          }, this.authAttempts * 1000);
        });

        // Enhanced event handler with better error handling
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