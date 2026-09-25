export type DeviceType = 'light' | 'ac' | 'fan' | 'sensor' | 'door' | 'smoke';

export type ACMode = 'cool' | 'heat' | 'fan' | 'auto';

export interface DeviceModel {
  id: string;
  name: string;
  roomId: string;
  type: DeviceType;
  isOnline: boolean;
  isOn: boolean;
  brightness?: number; // 0.0 - 100.0
  colorValue?: string; // hex string e.g. #f59e0b
  currentTemp?: number;
  targetTemp?: number;
  acMode?: ACMode;
  fanSpeed?: number; // 1 - 4
  humidity?: number; // 0.0 - 100.0
  isOpen?: boolean;
  isAlert?: boolean;
  batteryLevel?: number; // 0 - 100
  powerWatts?: number; // Real-time power consumption
  mqttTopic?: string;
  lastUpdated?: string;
}

export interface RoomModel {
  id: string;
  name: string;
  icon: string;
  cluster: 'home' | 'project_1' | 'project_2' | 'project_n';
  clusterName: string;
  deviceCount: number;
}

export interface SceneModel {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  activeColor: string;
  isActive: boolean;
}

export interface GatewayStatus {
  isConnected: boolean;
  serverName: string;
  host: string;
  port: number;
  protocol: string;
  mqttBrokerConnected: boolean;
  databaseStatus: 'connected' | 'disconnected' | 'syncing';
  activeClientsCount: number; // e.g. 1 Mobile, 1 Web
  cpuUsage: number; // %
  ramUsage: number; // MB
  uptime: string;
  pingMs: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  source: 'AAA_Mobile' | 'AAA_Web' | 'AAA_Soft' | 'IoT_Device';
  deviceName: string;
  message: string;
  level: 'info' | 'warning' | 'alert' | 'success';
}

export interface MetricDataPoint {
  time: string;
  temp: number;
  humidity: number;
  power: number; // Watts
}
