// src/services/websocketService.js
class WebSocketService {
  constructor() {
    this.subscribers = new Map();
    this.socket = null;
    this.connect();
  }

  connect() {
    this.socket = new WebSocket('ws://localhost:5000');
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setTimeout(() => this.connect(), 5000);
    };
    this.socket.onopen = () => {
      console.log('WebSocket connected');
    };

    this.socket.onmessage = (event) => {
      try {
        const { type, data } = JSON.parse(event.data);
        switch (type) {
          case 'property_profile_updated':
          case 'invoice_generated':
          case 'vendor_updated':
            if (this.subscribers.has(type)) {
              this.subscribers.get(type).forEach(callback => callback(data));
            }
            break;
          default:
            if (this.subscribers.has(type)) {
              this.subscribers.get(type).forEach(callback => callback(data));
            }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected. Reconnecting...');
      setTimeout(() => this.connect(), 5000);
    };
  }

  subscribe(type, callback) {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type).add(callback);

    return () => {
      const callbacks = this.subscribers.get(type);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(type);
        }
      }
    };
  }
}




export const websocketService = new WebSocketService();