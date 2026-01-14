// src/firebase/error-emitter.ts

type Listener = (event: any) => void;
type Events = {
  [eventName: string]: Listener[];
};

class EventEmitter {
  private events: Events = {};

  on(eventName: string, listener: Listener): void {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(listener);
  }

  emit(eventName: string, data: any): void {
    const eventListeners = this.events[eventName];
    if (eventListeners) {
      eventListeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventName}:`, error);
        }
      });
    }
  }
}

// Global instance of the event emitter
export const errorEmitter = new EventEmitter();
