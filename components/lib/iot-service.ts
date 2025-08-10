// // IoT Data Service - Real ESP32 data integration via MQTT and Firebase
// import { database, firebaseDataService } from '@/lib/firebase'
// import { ref, set, onValue, push, get, DataSnapshot } from 'firebase/database'
// import { mqttService } from '@/lib/mqtt-service'

// export interface IoTSensorData {
//   food_percentage: number
//   water_percentage: number
//   temperature: number
//   humidity: number
//   air_quality_voltage: number
//   last_updated: number
// }

// export interface IoTControlData {
//   auto_feeding: boolean
//   area_sensor: boolean
//   laser_game: boolean
//   ac_temperature: number
// }

// export interface IoTHistoryEntry {
//   timestamp: number
//   temperature: number
//   humidity: number
//   food_percentage: number
//   water_percentage: number
//   air_quality_voltage: number
// }

// class IoTDataService {
//   // Initialize real data connection (no more mock simulation)
//   async initializeRealDataMode(): Promise<void> {
//     try {
//       console.log('🚀 REAL DATA MODE INITIALIZED')
//       console.log('📡 ESP32 Connection Details:')
//       console.log('  📤 ESP32 publishes: temperature, humidity, voltage, food_status, water_status')
//       console.log('  📥 ESP32 subscribes: feed, water_refill, temp controls')
//       console.log('  🔗 MQTT Broker: broker.hivemq.com')
//       console.log('  🌐 Firebase: Real-time storage enabled')
//       console.log('⚠️ MOCK SIMULATION DISABLED - waiting for real ESP32...')
      
//       // Initialize Firebase structure
//       await firebaseDataService.initializeFirebaseStructure()
      
//       console.log('✅ IoT Data Service initialized with Firebase integration')
//     } catch (error) {
//       console.warn('⚠️ Firebase initialization warning:', error)
//     }
//   }

//   // Subscribe to real-time sensor data (ESP32 via MQTT + Firebase backup)
//   subscribeSensorData(callback: (data: IoTSensorData) => void): () => void {
//     console.log('🔗 Connecting to REAL ESP32 data streams...')
    
//     // Primary: MQTT real-time data from ESP32
//     const unsubscribeMqtt = mqttService.subscribeSensorData((mqttData) => {
//       console.log('📊 ESP32 → MQTT → Web:', {
//         temp: `${mqttData.temperature.toFixed(1)}°C`,
//         humidity: `${mqttData.humidity.toFixed(1)}%`,
//         food: `${mqttData.food_percentage}%`,
//         water: `${mqttData.water_percentage}%`,
//         air: `${mqttData.air_quality_voltage.toFixed(2)}V`
//       })
//       callback(mqttData)
//     })

//     // Secondary: Firebase persistence (for offline data)
//     try {
//       const unsubscribeFirebase = firebaseDataService.subscribeSensorDataChanges((data) => {
//         if (data && data.last_updated) {
//           const age = Date.now() - data.last_updated
//           if (age < 60000) { // Only use Firebase data if it's less than 1 minute old
//             console.log('🔥 Firebase backup data used (fresh):', data)
//             callback(data)
//           }
//         }
//       })

//       return () => {
//         unsubscribeMqtt()
//         unsubscribeFirebase()
//       }
//     } catch (error) {
//       console.warn('⚠️ Firebase offline, using MQTT only:', error)
//       return unsubscribeMqtt
//     }
//   }

//   // Subscribe to control data
//   subscribeControlData(callback: (data: IoTControlData) => void): () => void {
//     try {
//       const unsubscribe = firebaseDataService.subscribeControlsChanges((data) => {
//         if (data) {
//           console.log('🎮 Control data updated:', data)
//           callback(data)
//         }
//       })

//       return unsubscribe
//     } catch (error) {
//       console.warn('⚠️ Control data subscription failed:', error)
//       return () => {}
//     }
//   }

//   // Send control command to ESP32 via MQTT
//   async sendControlCommand(command: string, value: any): Promise<boolean> {
//     try {
//       console.log(`📡 Sending command to ESP32: ${command} = ${value}`)
      
//       // Send via MQTT to ESP32
//       const success = await mqttService.sendCommand(command, value)
      
//       if (success) {
//         // Store command history in Firebase
//         await firebaseDataService.storeCommandHistory(command, value)
        
//         console.log(`✅ Command sent to ESP32: ${command}`)
//         return true
//       } else {
//         console.error(`❌ Failed to send command to ESP32: ${command}`)
//         return false
//       }
//     } catch (error) {
//       console.error('❌ Command sending error:', error)
//       return false
//     }
//   }

//   // Store historical data (called automatically by MQTT service)
//   async storeHistoricalData(data: IoTHistoryEntry): Promise<void> {
//     try {
//       // Use Firebase service for consistency
//       await firebaseDataService.storeHistoricalData(data)
//       console.log('📊 Historical data stored via Firebase service:', {
//         timestamp: new Date(data.timestamp).toLocaleString(),
//         temperature: data.temperature,
//         humidity: data.humidity
//       })
//     } catch (error) {
//       console.warn('⚠️ Historical data storage failed:', error)
//     }
//   }

//   // Get historical data (last 4 days)
//   async getHistoricalData(): Promise<IoTHistoryEntry[]> {
//     try {
//       const historyRef = ref(database, 'history')
//       const snapshot = await get(historyRef)
      
//       if (snapshot.exists()) {
//         const data = snapshot.val()
//         const entries = Object.values(data) as IoTHistoryEntry[]
        
//         // Filter last 4 days and sort by timestamp
//         const fourDaysAgo = Date.now() - (4 * 24 * 60 * 60 * 1000)
//         const filteredEntries = entries
//           .filter(entry => entry.timestamp > fourDaysAgo)
//           .sort((a, b) => a.timestamp - b.timestamp)
        
//         console.log(`📊 Retrieved ${filteredEntries.length} historical entries from Firebase`)
//         return filteredEntries
//       } else {
//         console.log('📊 No historical data found in Firebase')
//         return []
//       }
//     } catch (error) {
//       console.warn('⚠️ Failed to retrieve historical data:', error)
//       return []
//     }
//   }

//   // Subscribe to real-time historical data updates
//   subscribeHistoricalData(callback: (data: IoTHistoryEntry[]) => void): () => void {
//     try {
//       const historyRef = ref(database, 'history')
      
//       const unsubscribe = onValue(historyRef, (snapshot: DataSnapshot) => {
//         if (snapshot.exists()) {
//           const data = snapshot.val()
//           const entries = Object.values(data) as IoTHistoryEntry[]
          
//           // Filter last 4 days and sort by timestamp
//           const fourDaysAgo = Date.now() - (4 * 24 * 60 * 60 * 1000)
//           const filteredEntries = entries
//             .filter(entry => entry.timestamp > fourDaysAgo)
//             .sort((a, b) => a.timestamp - b.timestamp)
          
//           console.log(`📊 Real-time historical update: ${filteredEntries.length} entries`)
//           callback(filteredEntries)
//         }
//       })

//       return unsubscribe
//     } catch (error) {
//       console.warn('⚠️ Historical data subscription failed:', error)
//       return () => {}
//     }
//   }

//   // Convert voltage to air quality status (based on ESP32 code)
//   getAirQualityStatus(voltage: number): string {
//     if (voltage < 0.4) return "Không khí sạch"
//     else if (voltage < 1.2) return "Bình thường"
//     else if (voltage < 2.0) return "Khí nhẹ"
//     else if (voltage < 2.8) return "Rò rỉ nhẹ!"
//     else return "Cảnh báo khí mạnh!"
//   }

//   // Check if ESP32 is online (via MQTT service)
//   isESP32Online(): boolean {
//     return mqttService.isConnected()
//   }

//   // Request notification permission for alerts
//   async requestNotificationPermission(): Promise<boolean> {
//     if ('Notification' in window) {
//       const permission = await Notification.requestPermission()
//       return permission === 'granted'
//     }
//     return false
//   }

//   // Manual alert testing (for development)
//   resetAlertCooldown(): void {
//     mqttService.resetAlertCooldown()
//     console.log('🔄 Alert cooldown reset - ready for immediate alerts')
//   }
// }

// // Export singleton instance
// export const iotDataService = new IoTDataService()



// iot-service.ts - CLEAN VERSION - CHỈ LÀM IOT COORDINATION
import { firebaseDataService, ChartDataPoint } from '@/lib/firebase';
import { mqttService, IoTSensorData } from '@/lib/mqtt-service';

// 📊 IOT INTERFACES
export interface IoTControlData {
  auto_feeding: boolean;
  area_sensor: boolean;
  laser_game: boolean;
  ac_temperature: number;
}

// 🤖 IOT SERVICE - COORDINATE MQTT + FIREBASE
class IoTDataService {
  // Initialize IoT system
  async initializeRealDataMode(): Promise<void> {
    try {
      console.log('🚀 IoT SYSTEM INITIALIZING...');
      console.log('📡 ESP32 → MQTT → Web Dashboard → Firebase');
      console.log('🔗 MQTT Broker: Auto-select from pool');
      console.log('🔥 Firebase: Real-time storage enabled');
      
      // Initialize Firebase structure
      await firebaseDataService.initializeFirebaseStructure();
      
      console.log('✅ IoT Data Service ready');
    } catch (error) {
      console.warn('⚠️ IoT initialization warning:', error);
    }
  }

  // 📊 SENSOR DATA MANAGEMENT
  subscribeSensorData(callback: (data: IoTSensorData) => void): () => void {
    console.log('🔗 Subscribing to ESP32 sensor data...');
    
    // Primary: Real-time MQTT data from ESP32
    const unsubscribeMqtt = mqttService.subscribeSensorData((mqttData) => {
      console.log('📊 ESP32 → MQTT → Dashboard:', {
        temp: `${mqttData.temperature.toFixed(1)}°C`,
        humidity: `${mqttData.humidity.toFixed(1)}%`,
        food: `${mqttData.food_percentage}%`,
        water: `${mqttData.water_percentage}%`
      });
      
      // Data already stored to Firebase by MQTT service
      callback(mqttData);
    });

    // Fallback: Firebase data (for offline scenarios)
    const unsubscribeFirebase = firebaseDataService.subscribeSensorDataChanges((firebaseData) => {
      if (firebaseData && firebaseData.last_updated) {
        const age = Date.now() - firebaseData.last_updated;
        if (age < 30000) { // Only use if fresh (< 30 seconds)
          console.log('🔥 Using Firebase backup data (fresh)');
          callback(firebaseData as IoTSensorData);
        }
      }
    });

    return () => {
      unsubscribeMqtt();
      unsubscribeFirebase();
    };
  }

  // 🎮 CONTROL MANAGEMENT
  subscribeControlData(callback: (data: IoTControlData) => void): () => void {
    return firebaseDataService.subscribeControlsChanges((data) => {
      if (data) {
        callback(data as IoTControlData);
      }
    });
  }

  async sendControlCommand(command: string, value: any): Promise<boolean> {
    try {
      console.log(`📡 Sending to ESP32: ${command} = ${value}`);
      
      // Send via MQTT to ESP32
      const mqttSuccess = await mqttService.sendCommand(command, value);
      
      if (mqttSuccess) {
        // Store command in Firebase
        await firebaseDataService.storeCommandHistory(command, value);
        console.log(`✅ Command sent: ${command}`);
        return true;
      } else {
        console.error(`❌ MQTT command failed: ${command}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Command error:', error);
      return false;
    }
  }

  // 📊 CHART DATA (delegate to Firebase service)
  async getChartData(): Promise<ChartDataPoint[]> {
    return await firebaseDataService.getChartData();
  }

  subscribeToChartData(callback: (data: ChartDataPoint[]) => void): () => void {
    return firebaseDataService.subscribeToChartData(callback);
  }

  // 🔧 UTILITY FUNCTIONS
  getAirQualityStatus(voltage: number): string {
    if (voltage < 0.4) return "Không khí sạch";
    else if (voltage < 1.2) return "Bình thường";
    else if (voltage < 2.0) return "Khí nhẹ";
    else if (voltage < 2.8) return "Rò rỉ nhẹ!";
    else return "Cảnh báo khí mạnh!";
  }

  isESP32Online(): boolean {
    return mqttService.isConnected();
  }

  async requestNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  resetAlertCooldown(): void {
    mqttService.resetAlertCooldown();
    console.log('🔄 Alert cooldown reset');
  }
}

export const iotDataService = new IoTDataService();