/**
 * ESP32 -> MQTT -> Firebase( Sensor Data) and email alerts when (Food < 20%)
 */




const mqtt = require('mqtt');
const https = require('https');
const nodemailer = require('nodemailer');
const { error } = require('console');


console.log('Starting Simple MQTT-Firebase Bridge...');

// Email config

const EMAIL_CONFIG = {
    service: 'gmail',
    auth: {
        user: 'ndthanh308@gmail.com',
        pass: 'fdwnhnxnozehoqad'
    },
    to: 'ndthanh23@clc.fitus.edu.vn'
};

// Pushsafer config
const PUSHSAFER_CONFIG = {
    privateKey: 'UVAdqzltoikVMpKEPuhh',
    enabled: true,
    device: 'a'
};


const ALERT_CONFIG = {
    cooldown: 30 * 60 * 1000,
    food_threshold: 20,
    water_threshold: 20
};


let lastAlertTime = {food: 0, water: 0};


// MQTT config
const MQTT_CONFIG = {
    broker: 'mqtt://test.mosquitto.org:1883',
    topics: {
        TEMPERATURE: 'lalaland/temperature',
        HUMIDITY: 'lalaland/humidity',
        VOLTAGE: 'lalaland/voltage',
        FOOD_STATUS: 'lalaland/food_status',
        WATER_STATUS: 'lalaland/water_status'
    },
    options: {
        clientId: `catcare_bridge_${Date.now()}`,
        clean: true,
        reconnectPeriod: 50000
    }
};


// email service


const emailTransporter = nodemailer.createTransport({
    service: EMAIL_CONFIG.service,
    auth: EMAIL_CONFIG.auth
});

emailTransporter.verify((error, success) => {
    if(error) {
        console.error('❌ Email service failed:', error.message);
    } else {
        console.log('✅ Email service ready');
    }
});


// Pushsafer function I
async function sendPushSaferNotification(title, message, icon = 1, priority = 0) {
    if (!PUSHSAFER_CONFIG.enabled) {
        console.log('📱 Pushsafer disabled');
        return;
    }

    try {
        console.log('📱 Sending Pushsafer notification...');

        // 🔧 SỬA LỖI: Dùng application/x-www-form-urlencoded thay vì JSON
        const postData = new URLSearchParams({
            k: PUSHSAFER_CONFIG.privateKey,
            d: PUSHSAFER_CONFIG.device,
            m: message,
            t: title,
            i: icon.toString(),
            p: priority.toString(),
            s: '2'
        }).toString();

        const options = {
            hostname: 'www.pushsafer.com',
            port: 443,
            path: '/api',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        console.log('📱 Pushsafer request data:', {
            privateKey: PUSHSAFER_CONFIG.privateKey.substring(0, 8) + '...',
            device: PUSHSAFER_CONFIG.device,
            title: title,
            messageLength: message.length
        });

        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    console.log('📱 Pushsafer response status:', res.statusCode);
                    console.log('📱 Pushsafer response data:', responseData);
                    
                    if (res.statusCode === 200) {
                        try {
                            const result = JSON.parse(responseData);
                            if (result.status === 1) {
                                console.log('✅ Pushsafer notification sent successfully');
                                resolve(result);
                            } else {
                                console.error('❌ Pushsafer API error:', result.error || result);
                                reject(new Error(result.error || 'Unknown API error'));
                            }
                        } catch (parseError) {
                            console.error('❌ Pushsafer response parse error:', parseError.message);
                            console.error('Raw response:', responseData);
                            reject(parseError);
                        }
                    } else {
                        console.error('❌ Pushsafer HTTP error:', res.statusCode);
                        console.error('Response:', responseData);
                        reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
                    }
                });
            });

            req.on('error', (error) => {
                console.error('❌ Pushsafer request error:', error.message);
                reject(error);
            });

            req.write(postData);
            req.end();
        });

    } catch (error) {
        console.error('❌ Pushsafer notification failed:', error.message);
        throw error;
    }
}



async function sendFoodAlert(foodPercentage) {


    // email alert
    try {
        await emailTransporter.sendMail({
        from: EMAIL_CONFIG.auth.user,
        to: EMAIL_CONFIG.to,
        subject: '🚨 CatCare Alert: Food Level Critical!',
        html: `
            <h2>🍽️ Food Level Critical Alert</h2>
            <p><strong>Food Level: ${foodPercentage}%</strong></p>
            <p>Alert Time: ${new Date().toLocaleString('vi-VN')}</p>
            <p>Please refill your cat's food container immediately.</p>
        `
        });
        console.log('✅ Food alert email sent');
    } catch (error) {
        console.error('❌ Email failed:', error.message);
    }


    // pushsafer alert
    try {
            await sendPushSaferNotification(
                '🚨 CatCare Food Alert',
                `Food level critical: ${foodPercentage}%\nPlease refill immediately!\nTime: ${new Date().toLocaleString('vi-VN')}`,
                1,  // Icon: Alarm
                1   // Priority: High
            );
        } catch (error) {
            console.error('❌ Pushsafer failed:', error.message);
        }
}


async function sendWaterAlert(waterPercentage) {

    // email alert
    try {
        await emailTransporter.sendMail({
        from: EMAIL_CONFIG.auth.user,
        to: EMAIL_CONFIG.to,
        subject: '🚨 CatCare Alert: Water Level Critical!',
        html: `
            <h2>💧 Water Level Critical Alert</h2>
            <p><strong>Water Level: ${waterPercentage}%</strong></p>
            <p>Alert Time: ${new Date().toLocaleString('vi-VN')}</p>
            <p>Please refill your cat's water bowl immediately.</p>
        `
        });
        console.log('✅ Water alert email sent');
    } catch (error) {
        console.error('❌ Email failed:', error.message);
    }

    // pushsafer alert
    try {
        await sendPushSaferNotification(
            '🚨 CatCare Water Alert',
            `Water level critical: ${waterPercentage}%\nPlease refill immediately!\nTime: ${new Date().toLocaleString('vi-VN')}`,
            1,  // Icon: Alarm
            1   // Priority: High
        );
    } catch (error) {
        console.error('❌ Pushsafer failed:', error.message);
    }


}



// firebase functions

function updateFirebase(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'catcare-iot-default-rtdb.firebaseio.com',
      port: 443,
      path: `/${path}.json`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(responseData));
        } else {
          reject(new Error(`Firebase error: ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}


function pushToFirebase(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'catcare-iot-default-rtdb.firebaseio.com',
      port: 443,
      path: `/${path}.json`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(responseData));
        } else {
          reject(new Error(`Firebase error: ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}



// Alert function


async function checkAlert(type, percentage, threshold) {
  const now = Date.now();
  const timeSinceLastAlert = now - lastAlertTime[type];

  if (percentage <= threshold && timeSinceLastAlert >= ALERT_CONFIG.cooldown) {
    console.log(`🚨 ${type.toUpperCase()} ALERT: ${percentage}% (threshold: ${threshold}%)`);
    
    if (type === 'food') {
      await sendFoodAlert(percentage);
    } else {
      await sendWaterAlert(percentage);
    }
    
    lastAlertTime[type] = now;
    console.log(`⏰ Next ${type} alert in 30 minutes`);
  } else if (percentage <= threshold) {
    const timeLeft = Math.ceil((ALERT_CONFIG.cooldown - timeSinceLastAlert) / 60000);
    console.log(`⚠️ ${type} critical (${percentage}%) - cooldown ${timeLeft}min`);
  }
}


// main bridge

class SimpleBridge {
  constructor() {
    this.sensorData = {
      temperature: 0,
      humidity: 0,
      air_quality_voltage: 0,
      food_percentage: 0,
      water_percentage: 0,
      last_updated: Date.now()
    };
  }

  async start() {
    console.log('🔌 Connecting to MQTT...');
    
    this.client = mqtt.connect(MQTT_CONFIG.broker, MQTT_CONFIG.options);
    
    this.client.on('connect', () => {
      console.log('✅ MQTT connected');
      this.subscribeTopics();
    });
    
    this.client.on('message', (topic, message) => {
      this.handleMessage(topic, message.toString());
    });
    
    this.client.on('error', (error) => {
      console.error('❌ MQTT error:', error.message);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down...');
      this.client.end();
      process.exit(0);
    });
  }

  subscribeTopics() {
    Object.values(MQTT_CONFIG.topics).forEach(topic => {
      this.client.subscribe(topic);
      console.log(`📨 Subscribed: ${topic}`);
    });
  }

  async handleMessage(topic, message) {
    console.log(`📨 [${topic}] = ${message}`);

    try {
      let value = parseFloat(message);
      if (isNaN(value)) return;

      switch (topic) {
        case MQTT_CONFIG.topics.TEMPERATURE:
          this.sensorData.temperature = value;
          await this.saveToFirebase('temperature', value);
          break;
        case MQTT_CONFIG.topics.HUMIDITY:
          this.sensorData.humidity = value;
          await this.saveToFirebase('humidity', value);
          break;

        case MQTT_CONFIG.topics.VOLTAGE:
          this.sensorData.air_quality_voltage = value;
          await this.saveToFirebase('air_quality_voltage', value);
          break;

        case MQTT_CONFIG.topics.FOOD_STATUS:
          value = parseInt(message);
          this.sensorData.food_percentage = value;
          await this.saveToFirebase('food_percentage', value);
          await checkAlert('food', value, ALERT_CONFIG.food_threshold);
          break;

        case MQTT_CONFIG.topics.WATER_STATUS:
          value = parseInt(message);
          this.sensorData.water_percentage = value;
          await this.saveToFirebase('water_percentage', value);
          await checkAlert('water', value, ALERT_CONFIG.water_threshold);
          break;
      }

      await this.updateOverallData();

    } catch (error) {
      console.error('❌ Process error:', error.message);
    }
  }

  async saveToFirebase(sensorType, value) {
    try {
      // Update current value
      await updateFirebase(`sensors/${sensorType}`, value);
      
      // Add to history
      await pushToFirebase(`history/${sensorType}`, {
        timestamp: Date.now(),
        value: value,
        source: 'ESP32_Bridge'
      });
      
      console.log(`💾 ${sensorType}: ${value} → Firebase`);
    } catch (error) {
      console.error(`❌ Firebase save error:`, error.message);
    }
  }

  async updateOverallData() {
    try {
      this.sensorData.last_updated = Date.now();
      await updateFirebase('sensors', this.sensorData);
      console.log('📊 Overall data updated');
    } catch (error) {
      console.error('❌ Overall update error:', error.message);
    }
  }
}


const bridge = new SimpleBridge();
bridge.start().catch(error => {
  console.error('❌ Bridge failed:', error.message);
  process.exit(1);
});

console.log('🎯 Bridge monitoring ESP32 → Firebase + Email alerts');