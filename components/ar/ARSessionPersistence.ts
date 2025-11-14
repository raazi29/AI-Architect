import { PlacedObject } from '@/lib/types/ar';

/**
 * ARSessionPersistence Class
 * 
 * Handles saving and restoring AR session state to/from localStorage.
 * Allows users to resume their AR session after app background/foreground transitions.
 */
export class ARSessionPersistence {
  private readonly STORAGE_KEY = 'ar_session_state';
  private readonly MAX_AGE = 30 * 60 * 1000; // 30 minutes

  /**
   * Save AR session state
   */
  saveSession(data: {
    placedObjects: PlacedObject[];
    selectedObjectId: string | null;
    modelUrl: string;
    timestamp: number;
  }): void {
    try {
      const sessionData = {
        ...data,
        timestamp: Date.now(),
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData));
      console.log('AR session saved to localStorage');
    } catch (error) {
      console.error('Failed to save AR session:', error);
    }
  }

  /**
   * Load AR session state
   */
  loadSession(): {
    placedObjects: PlacedObject[];
    selectedObjectId: string | null;
    modelUrl: string;
    timestamp: number;
  } | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return null;

      const sessionData = JSON.parse(data);

      // Check if session is expired
      const age = Date.now() - sessionData.timestamp;
      if (age > this.MAX_AGE) {
        console.log('AR session expired, clearing...');
        this.clearSession();
        return null;
      }

      console.log('AR session loaded from localStorage');
      return sessionData;
    } catch (error) {
      console.error('Failed to load AR session:', error);
      return null;
    }
  }

  /**
   * Clear AR session state
   */
  clearSession(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('AR session cleared from localStorage');
    } catch (error) {
      console.error('Failed to clear AR session:', error);
    }
  }

  /**
   * Check if session exists
   */
  hasSession(): boolean {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return false;

      const sessionData = JSON.parse(data);
      const age = Date.now() - sessionData.timestamp;

      return age <= this.MAX_AGE;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get session age in milliseconds
   */
  getSessionAge(): number {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return 0;

      const sessionData = JSON.parse(data);
      return Date.now() - sessionData.timestamp;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Update session timestamp (keep alive)
   */
  updateTimestamp(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return;

      const sessionData = JSON.parse(data);
      sessionData.timestamp = Date.now();

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Failed to update session timestamp:', error);
    }
  }
}

export const arSessionPersistence = new ARSessionPersistence();
