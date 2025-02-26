// src/services/websocketService.js
import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.subscribers = new Map();
    this.socket = null;
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    this.connected = false;
  }

  connect() {
    if (this.connected || this.socket?.connected) return;

    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No authentication token available');
      return;
    }

    try {
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
        this.connected = true;
        console.log('WebSocket connected:', this.socket.id);
      });

      this.socket.on('disconnect', (reason) => {
        this.connected = false;
        console.log('WebSocket disconnected:', reason);
        if (reason === 'io server disconnect') {
          this.socket.connect();
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error.message);
        setTimeout(() => this.socket.connect(), 1000);
      });

      // Generic message handler
      this.socket.onAny((event, data) => {
        const callbacks = this.subscribers.get(event);
        if (callbacks) {
          callbacks.forEach(callback => callback(data));
        }
      });

    } catch (error) {
      console.error('WebSocket initialization error:', error);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
    }
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
    if (!this.socket) {
      console.warn('WebSocket not initialized');
      this.connect(); 
    }

    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Delaying emit until connection is established');
      setTimeout(() => this.emit(event, data), 500);
    }
  }
}

export const websocketService = new WebSocketService();