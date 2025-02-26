// Updated websocketService.js
import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.subscribers = new Map();
    this.socket = null;
    this.connect();
  }

  connect() {
    this.socket = io(import.meta.env.VITE_API_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        token: localStorage.getItem('token')
      }
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket.id);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected. Attempting reconnection...');
    });

   
    this.socket.onAny((event, data) => {
      if (this.subscribers.has(event)) {
        this.subscribers.get(event).forEach(callback => callback(data));
      }
    });
  }

  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event).add(callback);
    return () => this.unsubscribe(event, callback);
  }

  unsubscribe(event, callback) {
    if (this.subscribers.has(event)) {
      const callbacks = this.subscribers.get(event);
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.subscribers.delete(event);
      }
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
}

export const websocketService = new WebSocketService();
