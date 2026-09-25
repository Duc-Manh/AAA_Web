import type { DeviceModel, ActivityLog } from '../types';
import { INITIAL_DEVICES, INITIAL_LOGS } from '../data/mockData';

const CONFIG_KEY = 'aaa_iot_config';
const DEVICES_STORAGE_KEY = 'aaa_iot_devices';
const LOGS_STORAGE_KEY = 'aaa_iot_logs';

export interface ApiConfig {
  backendUrl: string;
  wsUrl: string;
  isLiveServer: boolean;
  pollIntervalMs: number;
}

const DEFAULT_CONFIG: ApiConfig = {
  backendUrl: 'http://localhost:5000/api',
  wsUrl: 'ws://localhost:5000/ws',
  isLiveServer: false, // Default to local simulator until AAA_Soft backend is started
  pollIntervalMs: 3000,
};

class ApiService {
  private config: ApiConfig;

  constructor() {
    const saved = localStorage.getItem(CONFIG_KEY);
    this.config = saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
  }

  getConfig(): ApiConfig {
    return { ...this.config };
  }

  saveConfig(newConfig: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));
  }

  // Load devices from storage or initial data
  getDevices(): DeviceModel[] {
    const saved = localStorage.getItem(DEVICES_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_DEVICES;
      }
    }
    return INITIAL_DEVICES;
  }

  saveDevices(devices: DeviceModel[]): void {
    localStorage.setItem(DEVICES_STORAGE_KEY, JSON.stringify(devices));
  }

  getLogs(): ActivityLog[] {
    const saved = localStorage.getItem(LOGS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_LOGS;
      }
    }
    return INITIAL_LOGS;
  }

  saveLogs(logs: ActivityLog[]): void {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 50)));
  }

  // Check connection to AAA_Soft Backend
  async checkBackendHealth(): Promise<{ online: boolean; message: string; pingMs: number }> {
    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${this.config.backendUrl}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const pingMs = Math.round(performance.now() - start);
      if (res.ok) {
        return { online: true, message: 'Đã kết nối với AAA_Soft Gateway', pingMs };
      }
      return { online: false, message: `Server phản hồi mã lỗi: ${res.status}`, pingMs };
    } catch {
      const pingMs = Math.round(performance.now() - start);
      return { 
        online: false, 
        message: 'Chưa phát hiện AAA_Soft Server đang chạy (Đang chạy ở chế độ Mô phỏng cục bộ)', 
        pingMs 
      };
    }
  }

  // Send control command to device (e.g. toggle, slider, color)
  async updateDeviceCommand(
    deviceId: string, 
    patch: Partial<DeviceModel>,
    currentDevices: DeviceModel[]
  ): Promise<DeviceModel[]> {
    const updatedDevices = currentDevices.map((dev) => {
      if (dev.id === deviceId) {
        return { ...dev, ...patch, lastUpdated: 'Vừa xong' };
      }
      return dev;
    });

    this.saveDevices(updatedDevices);

    // If live server is enabled, send HTTP POST or MQTT command to AAA_Soft
    if (this.config.isLiveServer) {
      try {
        await fetch(`${this.config.backendUrl}/devices/${deviceId}/command`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
      } catch (err) {
        console.warn('Lỗi gửi lệnh tới AAA_Soft Backend:', err);
      }
    }

    return updatedDevices;
  }
}

export const apiService = new ApiService();
