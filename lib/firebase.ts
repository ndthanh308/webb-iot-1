// // Firebase configuration and real-time data service
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// import { getDatabase, Database, ref, set, push, onValue, serverTimestamp, off } from 'firebase/database';
// import { getAuth, Auth } from 'firebase/auth';

// // Your web app's Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyCxSSc0-cHA2JS5gTXMLXIYx5Lxvxg-rOI",
//   authDomain: "catcare-iot.firebaseapp.com",
//   databaseURL: "https://catcare-iot-default-rtdb.firebaseio.com",
//   projectId: "catcare-iot",
//   storageBucket: "catcare-iot.firebasestorage.app",
//   messagingSenderId: "93953920260",
//   appId: "1:93953920260:web:77f2181d5621e7fcff5451",
//   measurementId: "G-8J6N6BELLM"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);

// // Initialize Analytics only on client side
// let analytics;
// if (typeof window !== 'undefined') {
//   analytics = getAnalytics(app);
// }

// // Initialize Firebase services
// export const database: Database = getDatabase(app);
// export const auth: Auth = getAuth(app);



// export interface ChartDataPoint {
//   time: string;
//   temperature?: number;
//   humidity?: number;
//   food?: number;
//   water?: number;
//   timestamp: number;
// }


// export interface HistoryEntry {
//   sensor_type: string;
//   source: string;
//   timestamp: number;
//   value: number;
// }



// // Firebase Data Service - Listen to MQTT and store to Firebase
// class FirebaseDataService {
//   private initialized = false;

//   // Initialize Firebase data structure
//   async initializeFirebaseStructure(): Promise<void> {
//     if (this.initialized) return;

//     try {
//       console.log('🔥 Initializing Firebase data structure...');

//       // Initialize default sensor data
//       const defaultSensorData = {
//         food_percentage: 0,
//         water_percentage: 0,
//         temperature: 0,
//         humidity: 0,
//         air_quality_voltage: 0,
//         last_updated: Date.now(),
//         esp32_connected: false
//       };

//       // Initialize default controls
//       const defaultControls = {
//         auto_feeding: false,
//         area_sensor: true,
//         laser_game: false,
//         ac_temperature: 25,
//         last_updated: Date.now()
//       };

//       // Set initial data
//       await set(ref(database, 'sensors'), defaultSensorData);
//       await set(ref(database, 'controls'), defaultControls);
      
//       console.log('✅ Firebase structure initialized');
//       this.initialized = true;
//     } catch (error) {
//       console.error('❌ Firebase initialization failed:', error);
//     }
//   }

//   // Store sensor data to Firebase (called by MQTT service)
//   async storeSensorData(data: any): Promise<void> {
//     try {
//       const sensorDataWithTimestamp = {
//         ...data,
//         last_updated: Date.now(),
//         server_timestamp: serverTimestamp()
//       };

//       await set(ref(database, 'sensors'), sensorDataWithTimestamp);
//       console.log('🔥 Sensor data stored to Firebase:', data);
//     } catch (error) {
//       console.error('❌ Failed to store sensor data:', error);
//     }
//   }

//   // Store individual sensor value to Firebase
//   async storeIndividualSensor(sensorType: string, value: number): Promise<void> {
//     try {
//       await set(ref(database, `sensors/${sensorType}`), value);
//       await set(ref(database, `sensors/last_updated`), Date.now());
//       console.log(`🔥 ${sensorType} stored to Firebase: ${value}`);
//     } catch (error) {
//       console.error(`❌ Failed to store ${sensorType}:`, error);
//     }
//   }

  

//   // Store command history
//   async storeCommandHistory(command: string, value: any): Promise<void> {
//     try {
//       const commandEntry = {
//         command,
//         value,
//         timestamp: Date.now(),
//         server_timestamp: serverTimestamp(),
//         source: 'web_dashboard'
//       };

//       await push(ref(database, 'commands'), commandEntry);
//       console.log(`📡 Command stored to Firebase: ${command} = ${value}`);
      
//       // Also update controls if it's a control command
//       await this.updateControlState(command, value);
//     } catch (error) {
//       console.error('❌ Failed to store command:', error);
//     }
//   }

//   // Update control state in Firebase
//   async updateControlState(command: string, value: any): Promise<void> {
//     try {
//       let controlKey = '';
      
//       switch (command) {
//         case 'ac_temperature':
//           controlKey = 'ac_temperature';
//           break;
//         case 'laser_game':
//           controlKey = 'laser_game';
//           break;
//         case 'area_sensor':
//           controlKey = 'area_sensor';
//           break;
//         case 'auto_feeding':
//           controlKey = 'auto_feeding';
//           break;
//         default:
//           return; // Don't update controls for other commands
//       }

//       if (controlKey) {
//         await set(ref(database, `controls/${controlKey}`), value);
//         await set(ref(database, 'controls/last_updated'), Date.now());
//         console.log(`🎮 Control updated: ${controlKey} = ${value}`);
//       }
//     } catch (error) {
//       console.error('❌ Failed to update control state:', error);
//     }
//   }

//   // Listen to sensor data changes
//   subscribeSensorDataChanges(callback: (data: any) => void): () => void {
//     const sensorsRef = ref(database, 'sensors');
    
//     const unsubscribe = onValue(sensorsRef, (snapshot) => {
//       const data = snapshot.val();
//       if (data) {
//         console.log('🔥 Firebase sensor data updated:', data);
//         callback(data);
//       }
//     });

//     return unsubscribe;
//   }

//   // Listen to controls changes
//   subscribeControlsChanges(callback: (data: any) => void): () => void {
//     const controlsRef = ref(database, 'controls');
    
//     const unsubscribe = onValue(controlsRef, (snapshot) => {
//       const data = snapshot.val();
//       if (data) {
//         console.log('🎮 Firebase controls updated:', data);
//         callback(data);
//       }
//     });

//     return unsubscribe;
//   }

//   // Update ESP32 connection status
//   async updateESP32Status(connected: boolean): Promise<void> {
//     try {
//       await set(ref(database, 'sensors/esp32_connected'), connected);
//       await set(ref(database, 'sensors/esp32_last_seen'), Date.now());
//       console.log(`🤖 ESP32 status updated: ${connected ? 'ONLINE' : 'OFFLINE'}`);
//     } catch (error) {
//       console.error('❌ Failed to update ESP32 status:', error);
//     }
//   }

  
//   // Transform Firebase history to chart data
//   private transformHistoryToChartData(historyData: Record<string, HistoryEntry>): ChartDataPoint[] {
//     console.log('🔄 Transforming history data for charts...');
    
//     // Group by timestamp
//     const groupedByTime: Record<number, Partial<ChartDataPoint>> = {};
    
//     Object.values(historyData).forEach(entry => {
//       const timestamp = entry.timestamp;
      
//       if (!groupedByTime[timestamp]) {
//         groupedByTime[timestamp] = {
//           timestamp: timestamp,
//           time: new Date(timestamp).toLocaleTimeString('vi-VN', {
//             hour: '2-digit',
//             minute: '2-digit'
//           })
//         };
//       }
      
//       // Map sensor types to chart data
//       switch (entry.sensor_type) {
//         case 'temperature':
//           groupedByTime[timestamp].temperature = entry.value;
//           break;
//         case 'humidity':
//           groupedByTime[timestamp].humidity = entry.value;
//           break;
//         case 'food_percentage':
//           groupedByTime[timestamp].food = entry.value;
//           break;
//         case 'water_percentage':
//           groupedByTime[timestamp].water = entry.value;
//           break;
//       }
//     });
    
//     // Convert to array and sort by timestamp
//     const chartData = Object.values(groupedByTime)
//       .sort((a, b) => a.timestamp - b.timestamp)
//       .slice(-24); // Keep last 24 data points
    
//     console.log('📊 Transformed chart data:', chartData);
//     return chartData as ChartDataPoint[];
//   }

//     // Subscribe to history for charts
//   public subscribeToHistoryForCharts(callback: (data: ChartDataPoint[]) => void): () => void {
//     const historyRef = ref(database, 'history');
    
//     const unsubscribe = onValue(historyRef, (snapshot) => {
//       try {
//         const data = snapshot.val();
//         if (data) {
//           const chartData = this.transformHistoryToChartData(data);
//           callback(chartData);
//         } else {
//           console.log('📊 No history data available');
//           callback([]);
//         }
//       } catch (error) {
//         console.error('❌ Error processing history data:', error);
//         callback([]);
//       }
//     });

//     return () => off(historyRef, 'value', unsubscribe);
//   }


//    // Store individual sensor data with better structure
//   public async storeHistoricalData(data: {
//     timestamp: number;
//     sensor_type: string;
//     value: number;
//   }): Promise<void> {
//     try {
//       const historyEntry = {
//         sensor_type: data.sensor_type,
//         source: 'ESP32_MQTT_Bridge',
//         timestamp: data.timestamp,
//         value: data.value
//       };

//       await push(ref(database, `history/${data.sensor_type}`), historyEntry);
//       console.log(`📊 Historical data stored: ${data.sensor_type} = ${data.value}`);
//     } catch (error) {
//       console.error('❌ Failed to store historical data:', error);
//       throw error;
//     }
//   }


//   // 🚀 NEW: Get specific sensor history
//   public async getSensorHistory(sensorType: string, limitLast: number = 24): Promise<{timestamp: number, value: number}[]> {
//     try {
//       const sensorRef = ref(database, `history/${sensorType}`);
//       const snapshot = await get(sensorRef);
      
//       if (snapshot.exists()) {
//         const data = snapshot.val();
//         const entries = Object.values(data) as {timestamp: number, value: number}[];
        
//         // Sort by timestamp and get latest
//         return entries
//           .sort((a, b) => a.timestamp - b.timestamp)
//           .slice(-limitLast);
//       }
      
//       return [];
//     } catch (error) {
//       console.error(`❌ Failed to get ${sensorType} history:`, error);
//       return [];
//     }
//   }
      
// }

// // Export Firebase services
// export const firebaseDataService = new FirebaseDataService();
// export default app;



// firebase.ts - CLEAN VERSION
import { initializeApp } from "firebase/app";
import { getDatabase, Database, ref, set, push, onValue, serverTimestamp, off, get } from 'firebase/database';
import { getAuth, Auth } from 'firebase/auth';

// Firebase config
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

const app = initializeApp(firebaseConfig);
export const database: Database = getDatabase(app);
export const auth: Auth = getAuth(app);

// 📊 INTERFACES
export interface ChartDataPoint {
  time: string;
  temperature?: number;
  humidity?: number;
  food?: number;
  water?: number;
  timestamp: number;
}

export interface SensorHistoryEntry {
  timestamp: number;
  value: number;
  source: string;
}

// 🔥 FIREBASE SERVICE - CHỈ LÀM FIREBASE CRUD
class FirebaseDataService {
  private initialized = false;

  // Initialize Firebase structure
  async initializeFirebaseStructure(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🔥 Initializing Firebase structure...');

      const defaultSensorData = {
        food_percentage: 0,
        water_percentage: 0,
        temperature: 0,
        humidity: 0,
        air_quality_voltage: 0,
        last_updated: Date.now(),
        esp32_connected: false
      };

      const defaultControls = {
        auto_feeding: false,
        area_sensor: true,
        laser_game: false,
        ac_temperature: 25,
        last_updated: Date.now()
      };

      await set(ref(database, 'sensors'), defaultSensorData);
      await set(ref(database, 'controls'), defaultControls);
      
      console.log('✅ Firebase structure initialized');
      this.initialized = true;
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
    }
  }

  // 📊 SENSOR DATA OPERATIONS
  async storeSensorData(data: any): Promise<void> {
    try {
      const sensorDataWithTimestamp = {
        ...data,
        last_updated: Date.now(),
        server_timestamp: serverTimestamp()
      };

      await set(ref(database, 'sensors'), sensorDataWithTimestamp);
    } catch (error) {
      console.error('❌ Failed to store sensor data:', error);
    }
  }

  async storeIndividualSensor(sensorType: string, value: number): Promise<void> {
    try {
      await set(ref(database, `sensors/${sensorType}`), value);
      await set(ref(database, `sensors/last_updated`), Date.now());
    } catch (error) {
      console.error(`❌ Failed to store ${sensorType}:`, error);
    }
  }

  subscribeSensorDataChanges(callback: (data: any) => void): () => void {
    const sensorsRef = ref(database, 'sensors');
    const unsubscribe = onValue(sensorsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) callback(data);
    });
    return unsubscribe;
  }

  // 🎮 CONTROL OPERATIONS
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
      await this.updateControlState(command, value);
    } catch (error) {
      console.error('❌ Failed to store command:', error);
    }
  }

  async updateControlState(command: string, value: any): Promise<void> {
    try {
      const controlMap: Record<string, string> = {
        'ac_temperature': 'ac_temperature',
        'laser_game': 'laser_game',
        'area_sensor': 'area_sensor',
        'auto_feeding': 'auto_feeding'
      };

      const controlKey = controlMap[command];
      if (controlKey) {
        await set(ref(database, `controls/${controlKey}`), value);
        await set(ref(database, 'controls/last_updated'), Date.now());
      }
    } catch (error) {
      console.error('❌ Failed to update control state:', error);
    }
  }

  subscribeControlsChanges(callback: (data: any) => void): () => void {
    const controlsRef = ref(database, 'controls');
    const unsubscribe = onValue(controlsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) callback(data);
    });
    return unsubscribe;
  }

  // 📊 HISTORY OPERATIONS - OPTIMIZED STRUCTURE
  async storeSensorHistory(sensorType: string, value: number): Promise<void> {
    try {
      const historyEntry: SensorHistoryEntry = {
        timestamp: Date.now(),
        value: value,
        source: 'ESP32_MQTT_Bridge'
      };

      await push(ref(database, `history/${sensorType}`), historyEntry);
    } catch (error) {
      console.error('❌ Failed to store sensor history:', error);
    }
  }

  async getSensorHistory(sensorType: string, limitLast: number = 50): Promise<SensorHistoryEntry[]> {
    try {
      const sensorRef = ref(database, `history/${sensorType}`);
      const snapshot = await get(sensorRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const entries = Object.values(data) as SensorHistoryEntry[];
        
        return entries
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(-limitLast);
      }
      
      return [];
    } catch (error) {
      console.error(`❌ Failed to get ${sensorType} history:`, error);
      return [];
    }
  }

  subscribeToSensorHistory(sensorType: string, callback: (data: SensorHistoryEntry[]) => void): () => void {
    const sensorRef = ref(database, `history/${sensorType}`);
    
    const unsubscribe = onValue(sensorRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const entries = Object.values(data) as SensorHistoryEntry[];
          
          const sortedEntries = entries
            .sort((a, b) => a.timestamp - b.timestamp)
            .slice(-50);
            
          callback(sortedEntries);
        } else {
          callback([]);
        }
      } catch (error) {
        console.error(`❌ Error in ${sensorType} history subscription:`, error);
        callback([]);
      }
    });

    return () => off(sensorRef, 'value', unsubscribe);
  }

  // 📈 CHART DATA OPERATIONS
  async getChartData(): Promise<ChartDataPoint[]> {
    try {
      const [tempData, humidityData, foodData, waterData] = await Promise.all([
        this.getSensorHistory('temperature', 50),
        this.getSensorHistory('humidity', 50), 
        this.getSensorHistory('food_percentage', 50),
        this.getSensorHistory('water_percentage', 50)
      ]);

      const timeMap: Record<number, Partial<ChartDataPoint>> = {};

      const processSensorData = (entries: SensorHistoryEntry[], sensorKey: keyof ChartDataPoint) => {
        entries.forEach(entry => {
          const roundedTime = Math.floor(entry.timestamp / 60000) * 60000;
          if (!timeMap[roundedTime]) {
            timeMap[roundedTime] = {
              timestamp: roundedTime,
              time: new Date(roundedTime).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
              })
            };
          }
          (timeMap[roundedTime] as any)[sensorKey] = entry.value;
        });
      };

      processSensorData(tempData, 'temperature');
      processSensorData(humidityData, 'humidity');
      processSensorData(foodData, 'food');
      processSensorData(waterData, 'water');

      const chartData = Object.values(timeMap)
        .sort((a, b) => a.timestamp! - b.timestamp!)
        .slice(-50);

      return chartData as ChartDataPoint[];
      
    } catch (error) {
      console.error('❌ Failed to get chart data:', error);
      return [];
    }
  }

  subscribeToChartData(callback: (data: ChartDataPoint[]) => void): () => void {
    const unsubscribers: (() => void)[] = [];

    const updateChartData = async () => {
      const newData = await this.getChartData();
      callback(newData);
    };

    ['temperature', 'humidity', 'food_percentage', 'water_percentage'].forEach(sensorType => {
      const unsubscribe = this.subscribeToSensorHistory(sensorType, () => {
        updateChartData();
      });
      unsubscribers.push(unsubscribe);
    });

    updateChartData();

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }

  // 🤖 ESP32 STATUS
  async updateESP32Status(connected: boolean): Promise<void> {
    try {
      await set(ref(database, 'sensors/esp32_connected'), connected);
      await set(ref(database, 'sensors/esp32_last_seen'), Date.now());
    } catch (error) {
      console.error('❌ Failed to update ESP32 status:', error);
    }
  }
}

export const firebaseDataService = new FirebaseDataService();
export default app;