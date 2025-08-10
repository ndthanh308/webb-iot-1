'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { controlCommands, commandUtils } from '@/lib/mqtt-commands';
import { firebaseDataService } from '@/lib/firebase';
import { mqttService } from '@/lib/mqtt-service';
import { 
  Utensils, 
  Thermometer, 
  Zap, 
  Radar,
  Plus,
  Minus,
  Power,
  AlertTriangle,
  Settings
} from 'lucide-react';

export default function ControlPanel() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [controls, setControls] = useState({
    ac_temperature: 25,
    laser_game: false,
    area_sensor: true,
    auto_feeding: false
  });

  // Load controls from Firebase
  useEffect(() => {
    const unsubscribe = firebaseDataService.subscribeControlsChanges((data) => {
      if (data) {
        setControls({
          ac_temperature: data.ac_temperature || 25,
          laser_game: data.laser_game || false,
          area_sensor: data.area_sensor || true,
          auto_feeding: data.auto_feeding || false
        });
      }
    });

    return unsubscribe;
  }, []);

  const handleCommand = async (commandName: string, commandFn: () => Promise<void>) => {
    setIsLoading(commandName);
    try {
      await commandFn();
      console.log(`✅ ${commandName} command executed successfully`);
    } catch (error) {
      console.error(`❌ ${commandName} command failed:`, error);
      // You could add toast notifications here
    } finally {
      setIsLoading(null);
    }
  };

  // Handle feeding using MQTT service directly (compatible with existing code)
  const handleFeeding = async () => {
    setIsLoading('feeding');
    try {
      await mqttService.sendCommand('feed', { amount: 25 });
      console.log('✅ Feeding command sent successfully');
    } catch (error) {
      console.error('❌ Feeding command failed:', error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <Card className="w-full h-full bg-gray-800 border-gray-700 flex flex-col">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Điều khiển thiết bị
        </CardTitle>
        <CardDescription className="text-gray-400">
          Điều khiển các thiết bị từ xa qua ESP32
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 flex-1 flex flex-col">
        
        {/* Feeding Control */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white">Cho ăn</h3>
          <Button
            onClick={handleFeeding}
            disabled={isLoading === 'feeding'}
            className="w-full bg-purple-600 hover:bg-purple-500 active:bg-purple-700"
          >
            <Utensils className="mr-2 h-4 w-4" />
            {isLoading === 'feeding' ? '⏳ Đang cho ăn...' : '▶ Cho ăn ngay'}
          </Button>
        </div>

        {/* Auto Feeding Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm font-medium text-white">Cho ăn tự động</div>
            <div className="text-xs text-gray-400">
              {controls.auto_feeding ? 'Đang bật' : 'Tắt'}
            </div>
          </div>
          <Switch
            checked={controls.auto_feeding}
            onCheckedChange={(checked) => {
              handleCommand('toggleAutoFeeding', () => controlCommands.toggleAreaSensor(checked));
            }}
            disabled={isLoading === 'toggleAutoFeeding'}
          />
        </div>

        {/* Area Sensor Control */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm font-medium text-white flex items-center gap-2">
              <Radar className="h-4 w-4" />
              Cảm biến khu vực
            </div>
            <div className="text-xs text-gray-400">
              {controls.area_sensor ? 'Đang giám sát' : 'Tắt'}
            </div>
          </div>
          <Switch
            checked={controls.area_sensor}
            onCheckedChange={(checked) => {
              handleCommand('toggleAreaSensor', () => controlCommands.toggleAreaSensor(checked));
            }}
            disabled={isLoading === 'toggleAreaSensor'}
          />
        </div>

        {/* Laser Game Control */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm font-medium text-white flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Laser Game
            </div>
            <div className="text-xs text-gray-400">
              {controls.laser_game ? 'Đang hoạt động' : 'Tắt'}
            </div>
          </div>
          <Switch
            checked={controls.laser_game}
            onCheckedChange={(checked) => {
              handleCommand('toggleLaser', () => controlCommands.toggleLaser(checked));
            }}
            disabled={isLoading === 'toggleLaser'}
          />
        </div>

        {/* Temperature Control */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white">Điều khiển nhiệt độ</h3>
          
          {/* Temperature Display & Quick Controls */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCommand('decreaseTemp', controlCommands.decreaseTemp)}
              disabled={isLoading === 'decreaseTemp' || controls.ac_temperature <= 16}
              className="border-gray-600 text-white hover:bg-gray-700"
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            <div className="text-center">
              <div className="text-lg font-bold text-white">{controls.ac_temperature}°C</div>
              <div className="text-xs text-gray-400">Nhiệt độ AC</div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCommand('increaseTemp', controlCommands.increaseTemp)}
              disabled={isLoading === 'increaseTemp' || controls.ac_temperature >= 30}
              className="border-gray-600 text-white hover:bg-gray-700"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Temperature Slider */}
          <div className="space-y-2">
            <Slider
              value={[controls.ac_temperature]}
              onValueChange={(value) => {
                const newTemp = value[0];
                setControls(prev => ({ ...prev, ac_temperature: newTemp }));
              }}
              onValueCommit={(value) => {
                handleCommand('setACTemp', () => controlCommands.setACTemp(value[0]));
              }}
              max={30}
              min={16}
              step={1}
              className="w-full"
              disabled={isLoading !== null}
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>16°C</span>
              <span>30°C</span>
            </div>
          </div>
        </div>

        {/* Emergency Stop */}
        <div className="pt-4 border-t border-gray-700">
          <Button
            onClick={() => handleCommand('emergencyStop', commandUtils.emergencyStop)}
            disabled={isLoading === 'emergencyStop'}
            variant="destructive"
            className="w-full"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            {isLoading === 'emergencyStop' ? 'Đang dừng...' : 'Dừng khẩn cấp'}
          </Button>
        </div>

        {/* Connection Status */}
        <div className="pt-2">
          <div className="text-xs text-gray-400 text-center">
            {isLoading ? `Đang gửi lệnh ${isLoading}...` : 'Sẵn sàng điều khiển'}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
