// MQTT Command Service - Send commands from Web to ESP32
import { mqttService } from './mqtt-service';
import { firebaseDataService } from './firebase';

export interface ControlCommands {
  feeding: () => Promise<void>;
  increaseTemp: () => Promise<void>;
  decreaseTemp: () => Promise<void>;
  toggleLaser: (enable: boolean) => Promise<void>;
  toggleAreaSensor: (enable: boolean) => Promise<void>;
  setACTemp: (temperature: number) => Promise<void>;
}

class MQTTCommandService {
  private currentACTemp = 25; // Track current AC temperature
  
  // Initialize command service
  async initialize(): Promise<void> {
    try {
      console.log('🎮 MQTT Command Service initialized');
      // Load current AC temperature from Firebase controls
      this.loadCurrentControlStates();
    } catch (error) {
      console.error('❌ Failed to initialize MQTT Command Service:', error);
    }
  }

  // Load current control states from Firebase
  private loadCurrentControlStates(): void {
    firebaseDataService.subscribeControlsChanges((data) => {
      if (data && data.ac_temperature) {
        this.currentACTemp = data.ac_temperature;
        console.log('🌡️ Current AC temperature loaded:', this.currentACTemp);
      }
    });
  }

  // Send feeding command
  async sendFeedingCommand(): Promise<void> {
    try {
      const success = await mqttService.sendCommand('feed', true);
      if (success) {
        await firebaseDataService.storeCommandHistory('feeding', true);
        console.log('🍽️ Feeding command sent to ESP32');
      } else {
        throw new Error('Failed to send MQTT command');
      }
    } catch (error) {
      console.error('❌ Failed to send feeding command:', error);
      throw error;
    }
  }

  // Send AC temperature control
  async sendACTemperatureCommand(temperature: number): Promise<void> {
    try {
      // Validate temperature range
      if (temperature < 16 || temperature > 30) {
        throw new Error('Temperature must be between 16°C and 30°C');
      }

      // Update Firebase controls first
      await firebaseDataService.storeCommandHistory('ac_temperature', temperature);
      this.currentACTemp = temperature; // Update local tracking

      const success = await mqttService.sendCommand('increase_temp', temperature);
      if (success) {
        console.log(`🌡️ AC temperature command sent via MQTT: ${temperature}°C`);
      }
      
      console.log(`🌡️ AC temperature updated in Firebase: ${temperature}°C`);
      // Note: For AC control, we mainly update Firebase as ESP32 will read from there
    } catch (error) {
      console.error('❌ Failed to send AC temperature command:', error);
      throw error;
    }
  }

  // Send laser game control
  async sendLaserGameCommand(enable: boolean): Promise<void> {
    try {
      // For now, just store in Firebase as command history
      // ESP32 can read this state from Firebase controls
      await firebaseDataService.storeCommandHistory('laser_game', enable);
      console.log(`🔴 Laser game command stored: ${enable ? 'ON' : 'OFF'}`);
    } catch (error) {
      console.error('❌ Failed to send laser game command:', error);
      throw error;
    }
  }

  // Send area sensor control
  async sendAreaSensorCommand(enable: boolean): Promise<void> {
    try {
      // Store in Firebase as command history
      await firebaseDataService.storeCommandHistory('area_sensor', enable);
      console.log(`📡 Area sensor command stored: ${enable ? 'ON' : 'OFF'}`);
    } catch (error) {
      console.error('❌ Failed to send area sensor command:', error);
      throw error;
    }
  }

  // Quick temperature controls
  async increaseTemperature(): Promise<void> {
    try {
      const newTemp = Math.min(30, this.currentACTemp + 1);
      await this.sendACTemperatureCommand(newTemp);
    } catch (error) {
      console.error('❌ Failed to increase temperature:', error);
      throw error;
    }
  }

  async decreaseTemperature(): Promise<void> {
    try {
      const newTemp = Math.max(16, this.currentACTemp - 1);
      await this.sendACTemperatureCommand(newTemp);
    } catch (error) {
      console.error('❌ Failed to decrease temperature:', error);
      throw error;
    }
  }

  // Send emergency stop command
  async sendEmergencyStop(): Promise<void> {
    try {
      await firebaseDataService.storeCommandHistory('emergency_stop', true);
      console.log('🚨 Emergency stop command stored');
    } catch (error) {
      console.error('❌ Failed to send emergency stop command:', error);
      throw error;
    }
  }

  // Get current AC temperature
  getCurrentACTemp(): number {
    return this.currentACTemp;
  }

  // Update current AC temperature (from Firebase or MQTT status)
  updateCurrentACTemp(temperature: number): void {
    this.currentACTemp = temperature;
  }
}

// Create singleton instance
export const mqttCommandService = new MQTTCommandService();

// Export individual command functions for easy use in components
export const controlCommands: ControlCommands = {
  feeding: () => mqttCommandService.sendFeedingCommand(),
  increaseTemp: () => mqttCommandService.increaseTemperature(),
  decreaseTemp: () => mqttCommandService.decreaseTemperature(),
  toggleLaser: (enable: boolean) => mqttCommandService.sendLaserGameCommand(enable),
  toggleAreaSensor: (enable: boolean) => mqttCommandService.sendAreaSensorCommand(enable),
  setACTemp: (temperature: number) => mqttCommandService.sendACTemperatureCommand(temperature)
};

// Export additional utility functions
export const commandUtils = {
  emergencyStop: () => mqttCommandService.sendEmergencyStop(),
  getCurrentACTemp: () => mqttCommandService.getCurrentACTemp(),
  updateACTemp: (temp: number) => mqttCommandService.updateCurrentACTemp(temp)
};
