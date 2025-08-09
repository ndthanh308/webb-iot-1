// MQTT Service - Real-time IoT communication via MQTT broker for CatCare
import { database, firebaseDataService } from '@/lib/firebase'
import { ref, set, push } from 'firebase/database'

// Dynamic imports to avoid SSR issues
let mqtt: any = null;
let emailjs: any = null;

if (typeof window !== 'undefined') {
  // Load MQTT only on client side
  import('mqtt').then((module) => {
    mqtt = module.default;
    console.log('✅ MQTT module loaded');
  });

  // Load EmailJS
  import('@emailjs/browser').then((module) => {
    emailjs = module.default;
    emailjs.init('wDHGbOUSzglBM7ePp'); // Your EmailJS Public Key
    console.log('✅ EmailJS module loaded');
  });
}

export interface IoTSensorData {
  food_percentage: number
  water_percentage: number
  temperature: number
  humidity: number
  air_quality_voltage: number
  last_updated: number
}

export interface IoTHistoryEntry {
  timestamp: number
  food_percentage: number
  water_percentage: number
  temperature: number
  humidity: number
  air_quality_voltage: number
}

// MQTT Configuration - Optimized for reliability
const MQTT_BROKERS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://test.mosquitto.org:8081/mqtt',
  'wss://broker.hivemq.com:8000/mqtt'
]

let currentBrokerIndex = 0
let connectionAttempts = 0
const MAX_CONNECTION_ATTEMPTS = 3

const MQTT_OPTIONS = {
  clientId: `catcare_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
  clean: true,
  reconnectPeriod: 5000,     // Slower reconnect to avoid spam
  connectTimeout: 15 * 1000, // Increased timeout
  keepalive: 60,             // Standard keepalive
  username: undefined,
  password: undefined,
  protocolVersion: 4,        // MQTT 3.1.1
  resubscribe: true,         // Auto-resubscribe
}

// MQTT Topics Structure - Updated for ESP32 integration
export const MQTT_TOPICS = {
  // Sensor data from ESP32
  SENSORS: {
    TEMPERATURE: 'lalaland/temperature',           // ESP32 publishes temperature
    HUMIDITY: 'lalaland/humidity',                 // ESP32 publishes humidity  
    VOLTAGE: 'lalaland/voltage',                   // ESP32 publishes air quality voltage
    FOOD_STATUS: 'lalaland/food_status',           // ESP32 publishes food percentage
    WATER_STATUS: 'lalaland/water_status',         // ESP32 publishes water percentage
  },
  // Commands to ESP32
  COMMANDS: {
    FEED: 'lalaland/food_and_drink/feed',          // Web sends feed command
    WATER_REFILL: 'lalaland/water_refill',         // Web sends water refill command
    DECREASE_TEMP: 'lalaland/decreasetemp',        // Web sends decrease temp command
    INCREASE_TEMP: 'lalaland/increasetemp',        // Web sends increase temp command
  },
  // System status
  STATUS: {
    ESP32_ONLINE: 'lalaland/status/esp32_online',
    WEB_ONLINE: 'lalaland/status/web_online',
  }
}

class MQTTService {
  private client: any = null
  private connected = false
  private sensorData: Partial<IoTSensorData> = {}
  private sensorDataCallbacks: ((data: IoTSensorData) => void)[] = []
  private connectionCallbacks: ((connected: boolean) => void)[] = []
  
  // Alert system
  private lastAlertTime = 0
  private readonly ALERT_COOLDOWN = 5 * 60 * 1000 // 5 minutes cooldown

  constructor() {
    // Only connect if we're on the client side
    if (typeof window !== 'undefined') {
      console.log('🚀 MQTT Service initializing...');
      
      // Initialize Firebase structure first
      firebaseDataService.initializeFirebaseStructure();
      
      // Add debugging info
      console.log('🔧 Available brokers:', MQTT_BROKERS);
      console.log('🎯 Target topics:', Object.values(MQTT_TOPICS.SENSORS));
      
      // Wait for mqtt to load then connect
      this.waitForMqttAndConnect();
    }
  }

  private async waitForMqttAndConnect() {
    // Wait for mqtt module to load
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait
    
    while (!mqtt && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (mqtt) {
      this.connect();
    } else {
      console.error('❌ MQTT module failed to load');
    }
  }

  private connect() {
    if (!mqtt) {
      console.error('❌ MQTT module not available');
      return;
    }

    // Clean up previous connection
    if (this.client) {
      try {
        this.client.end(true);
      } catch (e) {
        // Ignore cleanup errors
      }
      this.client = null;
    }

    const currentBroker = MQTT_BROKERS[currentBrokerIndex];
    connectionAttempts++;

    try {
      console.log(`🚀 Connecting to MQTT broker (attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS}):`, currentBroker)
      this.client = mqtt.connect(currentBroker, MQTT_OPTIONS)

      // Connection timeout handler
      const timeoutId = setTimeout(() => {
        if (!this.connected) {
          console.log('⏰ Connection timeout, trying next broker...');
          this.tryNextBroker();
        }
      }, MQTT_OPTIONS.connectTimeout);

      this.client.on('connect', () => {
        clearTimeout(timeoutId);
        console.log('✅ Connected to MQTT broker successfully!')
        console.log('🔗 Using broker:', currentBroker)
        console.log('📡 Ready to receive ESP32 data on topics:', Object.values(MQTT_TOPICS.SENSORS))
        
        this.connected = true
        connectionAttempts = 0  // Reset on success
        currentBrokerIndex = 0  // Reset to first broker
        
        // Wait a bit before subscribing to ensure connection is stable
        setTimeout(() => {
          if (this.connected && this.client) {
            this.subscribeToTopics()
            this.publishWebStatus(true)
          }
        }, 100);
        
        this.notifyConnectionCallbacks(true)
        
        // Update ESP32 connection status in Firebase
        firebaseDataService.updateESP32Status(true)
      })

      this.client.on('disconnect', () => {
        clearTimeout(timeoutId);
        console.log('❌ Disconnected from MQTT broker')
        this.connected = false
        this.notifyConnectionCallbacks(false)
        
        // Update ESP32 connection status in Firebase
        firebaseDataService.updateESP32Status(false)
      })

      this.client.on('error', (error: any) => {
        clearTimeout(timeoutId);
        console.error('❌ MQTT connection error:', error)
        this.connected = false
        this.notifyConnectionCallbacks(false)
        
        // Try next broker if connection fails
        this.tryNextBroker()
      })

      this.client.on('message', (topic: string, message: Buffer) => {
        console.log(`🎯 RAW MQTT MESSAGE RECEIVED:`)
        console.log(`   Topic: ${topic}`)  
        console.log(`   Message: ${message.toString()}`)
        this.handleMessage(topic, message.toString())
      })

    } catch (error) {
      console.error('❌ Failed to connect to MQTT broker:', error)
      this.connected = false
      this.tryNextBroker()
    }
  }

  private tryNextBroker() {
    // Stop if we've exceeded max attempts
    if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
      console.log(`❌ Max connection attempts (${MAX_CONNECTION_ATTEMPTS}) reached. Retrying in 10 seconds...`);
      setTimeout(() => {
        connectionAttempts = 0;
        currentBrokerIndex = 0;
        this.connect();
      }, 10000);
      return;
    }
    
    // Try next broker in the list
    currentBrokerIndex = (currentBrokerIndex + 1) % MQTT_BROKERS.length
    
    console.log('🔄 Trying next broker...')
    setTimeout(() => {
      this.connect()
    }, 1000)
  }

  private subscribeToTopics() {
    if (!this.client || !this.connected) {
      console.log('⚠️ Cannot subscribe: client not ready')
      return
    }

    console.log('📡 Starting topic subscriptions...')

    // Subscribe to sensor topics with error handling
    Object.values(MQTT_TOPICS.SENSORS).forEach(topic => {
      try {
        this.client!.subscribe(topic, { qos: 0 }, (err: any) => {
          if (err) {
            console.error(`❌ Failed to subscribe to ${topic}:`, err)
          } else {
            console.log(`✅ Subscribed to ${topic}`)
          }
        })
      } catch (error) {
        console.error(`❌ Error subscribing to ${topic}:`, error)
      }
    })

    // Subscribe to ESP32 status with error handling
    try {
      this.client.subscribe(MQTT_TOPICS.STATUS.ESP32_ONLINE, { qos: 0 }, (err: any) => {
        if (err) {
          console.error('❌ Failed to subscribe to ESP32 status:', err)
        } else {
          console.log('✅ Subscribed to ESP32 status')
        }
      })
    } catch (error) {
      console.error('❌ Error subscribing to ESP32 status:', error)
    }
  }

  private handleMessage(topic: string, message: string) {
    try {
      console.log(`📨 MQTT message received [${topic}]:`, message)

      // Handle ESP32 data - save each sensor individually to Firebase
      switch (topic) {
        case MQTT_TOPICS.SENSORS.TEMPERATURE:
          const temperature = parseFloat(message)
          if (!isNaN(temperature)) {
            this.sensorData.temperature = temperature
            this.saveIndividualSensorToFirebase('temperature', temperature)
            console.log(`🌡️ Temperature updated: ${temperature}°C`)
          }
          break
        case MQTT_TOPICS.SENSORS.HUMIDITY:
          const humidity = parseFloat(message)
          if (!isNaN(humidity)) {
            this.sensorData.humidity = humidity
            this.saveIndividualSensorToFirebase('humidity', humidity)
            console.log(`💨 Humidity updated: ${humidity}%`)
          }
          break
        case MQTT_TOPICS.SENSORS.VOLTAGE:
          const voltage = parseFloat(message)
          if (!isNaN(voltage)) {
            this.sensorData.air_quality_voltage = voltage
            this.saveIndividualSensorToFirebase('air_quality_voltage', voltage)
            console.log(`🌬️ Air quality voltage updated: ${voltage}V`)
          }
          break
        case MQTT_TOPICS.SENSORS.FOOD_STATUS:
          const foodPercentage = parseInt(message)
          if (!isNaN(foodPercentage)) {
            this.sensorData.food_percentage = foodPercentage
            this.saveIndividualSensorToFirebase('food_percentage', foodPercentage)
            console.log(`🍽️ Food level updated: ${foodPercentage}%`)
          }
          break
        case MQTT_TOPICS.SENSORS.WATER_STATUS:
          const waterPercentage = parseInt(message)
          if (!isNaN(waterPercentage)) {
            this.sensorData.water_percentage = waterPercentage
            this.saveIndividualSensorToFirebase('water_percentage', waterPercentage)
            console.log(`💧 Water level updated: ${waterPercentage}%`)
          }
          break
        case MQTT_TOPICS.STATUS.ESP32_ONLINE:
          const statusData = JSON.parse(message)
          console.log('🤖 ESP32 status:', statusData.online ? 'ONLINE' : 'OFFLINE')
          break
        default:
          console.log(`⚠️ UNKNOWN TOPIC RECEIVED: ${topic} = ${message}`)
          console.log(`   Expected topics:`, Object.values(MQTT_TOPICS.SENSORS))
          break
      }

      // Update timestamp
      this.sensorData.last_updated = Date.now()

      // Always save current sensor data to Firebase (even if incomplete)
      this.saveCurrentSensorData()
      
      // Store individual historical data point
      this.storeIndividualHistoricalData(topic, message)
      
      // Check for alerts if we have food/water data
      if (this.sensorData.food_percentage !== undefined || this.sensorData.water_percentage !== undefined) {
        this.checkAlertsPartial()
      }
      
      // Always notify callbacks with current data
      this.notifyCallbacksWithCurrentData()

    } catch (error) {
      console.error('❌ Failed to parse MQTT message:', error, 'Topic:', topic, 'Message:', message)
    }
  }

  private async saveIndividualSensorToFirebase(sensorType: string, value: number) {
    try {
      // Use Firebase service to store individual sensor data
      console.log(`🔥 Saving to Firebase - ${sensorType}: ${value}`);
      await firebaseDataService.storeIndividualSensor(sensorType, value)
      console.log(`✅ Successfully saved ${sensorType} to Firebase`);
    } catch (error) {
      console.error(`❌ Failed to save ${sensorType} to Firebase:`, error)
    }
  }

  private async saveCurrentSensorData() {
    try {
      // Use Firebase service to store current sensor data
      const dataToSave = {
        ...this.sensorData,
        last_updated: Date.now()
      }
      await firebaseDataService.storeSensorData(dataToSave)
    } catch (error) {
      console.error('❌ Failed to save current sensor data:', error)
    }
  }

  private async storeIndividualHistoricalData(topic: string, message: string) {
    try {
      const timestamp = Date.now()
      let sensorType = ''
      let value: number

      switch (topic) {
        case MQTT_TOPICS.SENSORS.TEMPERATURE:
          sensorType = 'temperature'
          value = parseFloat(message)
          break
        case MQTT_TOPICS.SENSORS.HUMIDITY:
          sensorType = 'humidity'
          value = parseFloat(message)
          break
        case MQTT_TOPICS.SENSORS.VOLTAGE:
          sensorType = 'air_quality_voltage'
          value = parseFloat(message)
          break
        case MQTT_TOPICS.SENSORS.FOOD_STATUS:
          sensorType = 'food_percentage'
          value = parseInt(message)
          break
        case MQTT_TOPICS.SENSORS.WATER_STATUS:
          sensorType = 'water_percentage'
          value = parseInt(message)
          break
        default:
          return
      }

      if (!isNaN(value)) {
        const historyEntry = {
          timestamp,
          sensor_type: sensorType,
          value: value
        }

        await firebaseDataService.storeHistoricalData(historyEntry)
      }
    } catch (error) {
      console.error('❌ Failed to store individual historical data:', error)
    }
  }

  private async checkAlertsPartial() {
    const now = Date.now()
    const timeSinceLastAlert = now - this.lastAlertTime

    if (timeSinceLastAlert < this.ALERT_COOLDOWN) return

    const shouldAlert = (
      (this.sensorData.food_percentage !== undefined && this.sensorData.food_percentage < 20) ||
      (this.sensorData.water_percentage !== undefined && this.sensorData.water_percentage < 20)
    )

    if (shouldAlert) {
      console.log('🚨 Sending alert for low levels')
      await this.sendEmailAlertPartial()
      this.lastAlertTime = now
    }
  }

  private async sendEmailAlertPartial() {
    if (!emailjs) {
      console.warn('⚠️ EmailJS not loaded, skipping email alert')
      return
    }

    try {
      const messages = []
      if (this.sensorData.food_percentage !== undefined && this.sensorData.food_percentage < 20) {
        messages.push(`🍽️ Food level is critically low: ${this.sensorData.food_percentage}%`)
      }
      if (this.sensorData.water_percentage !== undefined && this.sensorData.water_percentage < 20) {
        messages.push(`💧 Water level is critically low: ${this.sensorData.water_percentage}%`)
      }

      if (messages.length === 0) return

      const emailParams = {
        to_email: 'owner@example.com',
        from_name: 'Cat Care IoT System',
        subject: '🚨 Cat Care Alert - Low Supplies Detected',
        message: `
⚠️ URGENT: Your cat's supplies need attention!

${messages.join('\n')}

📊 Current Status:
• Food Level: ${this.sensorData.food_percentage ?? 'N/A'}%
• Water Level: ${this.sensorData.water_percentage ?? 'N/A'}%
• Temperature: ${this.sensorData.temperature?.toFixed(1) ?? 'N/A'}°C
• Humidity: ${this.sensorData.humidity?.toFixed(1) ?? 'N/A'}%
• Air Quality: ${this.sensorData.air_quality_voltage?.toFixed(2) ?? 'N/A'}V

🕐 Alert Time: ${new Date().toLocaleString('vi-VN')}

Please refill your cat's supplies as soon as possible.

Best regards,
Cat Care IoT System 🐱
        `.trim()
      }

      await emailjs.send('service_dd66tu5', 'template_p4qoknm', emailParams)
      console.log('✅ Email alert sent successfully')
    } catch (error) {
      console.error('❌ Failed to send email alert:', error)
    }
  }

  private notifyCallbacksWithCurrentData() {
    // Create current data object with available values
    const currentData: Partial<IoTSensorData> & { last_updated: number } = {
      ...this.sensorData,
      last_updated: Date.now()
    }

    // Notify callbacks even with partial data
    this.sensorDataCallbacks.forEach(callback => {
      try {
        // Cast to IoTSensorData, dashboard will handle undefined values
        callback(currentData as IoTSensorData)
      } catch (error) {
        console.error('❌ Error in sensor data callback:', error)
      }
    })
  }

  private async saveToFirebase(data: IoTSensorData) {
    try {
      await set(ref(database, 'sensors'), data)
      console.log('🔥 Complete sensor data saved to Firebase')
    } catch (error) {
      console.error('❌ Failed to save complete data to Firebase:', error)
    }
  }

  private async storeHistoricalData(data: IoTSensorData) {
    try {
      const historyData: IoTHistoryEntry = {
        timestamp: data.last_updated,
        food_percentage: data.food_percentage,
        water_percentage: data.water_percentage,
        temperature: data.temperature,
        humidity: data.humidity,
        air_quality_voltage: data.air_quality_voltage
      }

      await push(ref(database, 'complete_history'), historyData)
      console.log('📊 Complete historical data stored')
    } catch (error) {
      console.error('❌ Failed to store complete historical data:', error)
    }
  }

  // Public methods for the dashboard
  public subscribeSensorData(callback: (data: IoTSensorData) => void): () => void {
    this.sensorDataCallbacks.push(callback)
    
    // Call immediately with current data (even if partial)
    if (this.sensorData.last_updated) {
      const currentData = {
        food_percentage: this.sensorData.food_percentage ?? 0,
        water_percentage: this.sensorData.water_percentage ?? 0,
        temperature: this.sensorData.temperature ?? 0,
        humidity: this.sensorData.humidity ?? 0,
        air_quality_voltage: this.sensorData.air_quality_voltage ?? 0,
        last_updated: this.sensorData.last_updated
      } as IoTSensorData
      callback(currentData)
    }

    // Return unsubscribe function
    return () => {
      const index = this.sensorDataCallbacks.indexOf(callback)
      if (index > -1) {
        this.sensorDataCallbacks.splice(index, 1)
      }
    }
  }

  public subscribeConnectionStatus(callback: (connected: boolean) => void): () => void {
    this.connectionCallbacks.push(callback)
    
    // Call immediately with current status
    callback(this.connected)

    // Return unsubscribe function
    return () => {
      const index = this.connectionCallbacks.indexOf(callback)
      if (index > -1) {
        this.connectionCallbacks.splice(index, 1)
      }
    }
  }

  public async sendCommand(command: string, value: any): Promise<boolean> {
    if (!this.client || !this.connected) {
      console.warn('⚠️ MQTT not connected, cannot send command')
      return false
    }

    try {
      const topic = this.getCommandTopic(command)
      if (!topic) {
        console.error('❌ Unknown command:', command)
        return false
      }

      // Send simple message to ESP32
      const message = "1" // Simple trigger for ESP32

      this.client.publish(topic, message, { qos: 1 }, (error: any) => {
        if (error) {
          console.error(`❌ Failed to send command ${command}:`, error)
        } else {
          console.log(`📤 Command sent [${topic}]: ${message}`)
        }
      })

      return true
    } catch (error) {
      console.error('❌ Failed to send command:', error)
      return false
    }
  }

  private getCommandTopic(command: string): string | null {
    switch (command) {
      case 'feed':
        return MQTT_TOPICS.COMMANDS.FEED
      case 'refill_water':
        return MQTT_TOPICS.COMMANDS.WATER_REFILL
      case 'decrease_temp':
        return MQTT_TOPICS.COMMANDS.DECREASE_TEMP
      case 'increase_temp':
        return MQTT_TOPICS.COMMANDS.INCREASE_TEMP
      default:
        return null
    }
  }

  public publishWebStatus(online: boolean) {
    if (!this.client) return

    const message = JSON.stringify({
      online: online,
      timestamp: Date.now(),
      client_id: MQTT_OPTIONS.clientId
    })

    this.client.publish(MQTT_TOPICS.STATUS.WEB_ONLINE, message, { retain: true })
  }

  private notifySensorDataCallbacks(data: IoTSensorData) {
    this.sensorDataCallbacks.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error('❌ Error in sensor data callback:', error)
      }
    })
  }

  private notifyConnectionCallbacks(connected: boolean) {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(connected)
      } catch (error) {
        console.error('❌ Error in connection callback:', error)
      }
    })
  }

  public isConnected(): boolean {
    return this.connected
  }

  public async requestNotificationPermission(): Promise<void> {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission()
        console.log('🔔 Notification permission:', permission)
      } catch (error) {
        console.error('❌ Failed to request notification permission:', error)
      }
    }
  }

  public resetAlertCooldown(): void {
    this.lastAlertTime = 0
    console.log('🔄 Alert cooldown reset')
  }

  public async getHistoricalData(): Promise<IoTHistoryEntry[]> {
    // For now, return empty array as we'll get this from Firebase
    return []
  }

  public subscribeHistoricalData(callback: (data: IoTHistoryEntry[]) => void): () => void {
    // For now, return empty unsubscribe function
    return () => {}
  }

  public disconnect() {
    if (this.client) {
      this.publishWebStatus(false)
      this.client.end()
      this.client = null
      this.connected = false
    }
  }
}

// Create singleton instance
export const mqttService = new MQTTService()

// Export for dashboard usage
export default mqttService
