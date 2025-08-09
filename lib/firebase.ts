// Firebase configuration and real-time data service
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, Database, ref, set, push, onValue, serverTimestamp } from 'firebase/database';
import { getAuth, Auth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCxSSc0-cHA2JS5gTXMLXIYx5Lxvxg-rOI",
  authDomain: "catcare-iot.firebaseapp.com",
  databaseURL: "https://catcare-iot-default-rtdb.firebaseio.com",
  projectId: "catcare-iot",
  storageBucket: "catcare-iot.firebasestorage.app",
  messagingSenderId: "93953920260",
  appId: "1:93953920260:web:77f2181d5621e7fcff5451",
  measurementId: "G-8J6N6BELLM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only on client side
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Initialize Firebase services
export const database: Database = getDatabase(app);
export const auth: Auth = getAuth(app);

// Firebase Data Service - Listen to MQTT and store to Firebase
class FirebaseDataService {
  private initialized = false;

  // Initialize Firebase data structure
  async initializeFirebaseStructure(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🔥 Initializing Firebase data structure...');

      // Initialize default sensor data
      const defaultSensorData = {
        food_percentage: 0,
        water_percentage: 0,
        temperature: 0,
        humidity: 0,
        air_quality_voltage: 0,
        last_updated: Date.now(),
        esp32_connected: false
      };

      // Initialize default controls
      const defaultControls = {
        auto_feeding: false,
        area_sensor: true,
        laser_game: false,
        ac_temperature: 25,
        last_updated: Date.now()
      };

      // Set initial data
      await set(ref(database, 'sensors'), defaultSensorData);
      await set(ref(database, 'controls'), defaultControls);
      
      console.log('✅ Firebase structure initialized');
      this.initialized = true;
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
    }
  }

  // Store sensor data to Firebase (called by MQTT service)
  async storeSensorData(data: any): Promise<void> {
    try {
      const sensorDataWithTimestamp = {
        ...data,
        last_updated: Date.now(),
        server_timestamp: serverTimestamp()
      };

      await set(ref(database, 'sensors'), sensorDataWithTimestamp);
      console.log('🔥 Sensor data stored to Firebase:', data);
    } catch (error) {
      console.error('❌ Failed to store sensor data:', error);
    }
  }

  // Store individual sensor value to Firebase
  async storeIndividualSensor(sensorType: string, value: number): Promise<void> {
    try {
      await set(ref(database, `sensors/${sensorType}`), value);
      await set(ref(database, `sensors/last_updated`), Date.now());
      console.log(`🔥 ${sensorType} stored to Firebase: ${value}`);
    } catch (error) {
      console.error(`❌ Failed to store ${sensorType}:`, error);
    }
  }

  // Store historical data
  async storeHistoricalData(data: any): Promise<void> {
    try {
      const historyEntry = {
        ...data,
        // Keep original timestamp if provided, otherwise use current time
        timestamp: data.timestamp || Date.now(),
        server_timestamp: serverTimestamp()
      };

      await push(ref(database, 'history'), historyEntry);
      console.log('📊 Historical data stored to Firebase:', {
        timestamp: new Date(historyEntry.timestamp).toLocaleString(),
        temperature: historyEntry.temperature,
        humidity: historyEntry.humidity
      });
    } catch (error) {
      console.error('❌ Failed to store historical data:', error);
    }
  }

  // Store command history
  async storeCommandHistory(command: string, value: any): Promise<void> {
    try {
      const commandEntry = {
        command,
        value,
        timestamp: Date.now(),
        server_timestamp: serverTimestamp(),
        source: 'web_dashboard'
      };

      await push(ref(database, 'commands'), commandEntry);
      console.log(`📡 Command stored to Firebase: ${command} = ${value}`);
      
      // Also update controls if it's a control command
      await this.updateControlState(command, value);
    } catch (error) {
      console.error('❌ Failed to store command:', error);
    }
  }

  // Update control state in Firebase
  async updateControlState(command: string, value: any): Promise<void> {
    try {
      let controlKey = '';
      
      switch (command) {
        case 'ac_temperature':
          controlKey = 'ac_temperature';
          break;
        case 'laser_game':
          controlKey = 'laser_game';
          break;
        case 'area_sensor':
          controlKey = 'area_sensor';
          break;
        case 'auto_feeding':
          controlKey = 'auto_feeding';
          break;
        default:
          return; // Don't update controls for other commands
      }

      if (controlKey) {
        await set(ref(database, `controls/${controlKey}`), value);
        await set(ref(database, 'controls/last_updated'), Date.now());
        console.log(`🎮 Control updated: ${controlKey} = ${value}`);
      }
    } catch (error) {
      console.error('❌ Failed to update control state:', error);
    }
  }

  // Listen to sensor data changes
  subscribeSensorDataChanges(callback: (data: any) => void): () => void {
    const sensorsRef = ref(database, 'sensors');
    
    const unsubscribe = onValue(sensorsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        console.log('🔥 Firebase sensor data updated:', data);
        callback(data);
      }
    });

    return unsubscribe;
  }

  // Listen to controls changes
  subscribeControlsChanges(callback: (data: any) => void): () => void {
    const controlsRef = ref(database, 'controls');
    
    const unsubscribe = onValue(controlsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        console.log('🎮 Firebase controls updated:', data);
        callback(data);
      }
    });

    return unsubscribe;
  }

  // Update ESP32 connection status
  async updateESP32Status(connected: boolean): Promise<void> {
    try {
      await set(ref(database, 'sensors/esp32_connected'), connected);
      await set(ref(database, 'sensors/esp32_last_seen'), Date.now());
      console.log(`🤖 ESP32 status updated: ${connected ? 'ONLINE' : 'OFFLINE'}`);
    } catch (error) {
      console.error('❌ Failed to update ESP32 status:', error);
    }
  }
}

// Export Firebase services
export const firebaseDataService = new FirebaseDataService();
export default app;
