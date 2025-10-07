// ユーザー情報の型定義
export interface User {
  id: string;
  email: string;
  displayName?: string;
  profile: UserProfile;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  name: string;
  capacitySettings: CapacitySettings;
}

export interface CapacitySettings {
  dailyCapacity: number; // デフォルト: 1.0
  weeklyCapacity: number; // デフォルト: 7.0
}

// 負荷データの型定義
export interface LoadData {
  emotional: number; // -1 to 1 (ネガティブ to ポジティブ)
  activity: number;  // -1 to 1 (インプット to アウトプット)
  intensity: number; // 0 to 1 (負荷の強さ)
}

// タスクの型定義
export interface Task {
  id: string;
  title: string;
  description?: string;
  scheduledDate?: Date;
  completed: boolean;
  load: LoadData;
  createdAt: Date;
  updatedAt: Date;
}

// スケジュールの型定義
export interface Schedule {
  id: string;
  userId: string;
  title: string;
  description?: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  load: LoadData;
  preparationTasks?: Task[];
  createdAt: Date;
  updatedAt: Date;
}

// 天気予報の型定義
export type WeatherIcon = '☀️' | '🌤️' | '☁️' | '🌧️' | '⛈️';

export interface WeatherForecast {
  date: Date;
  weather: WeatherIcon;
  totalLoad: number;
  scheduleCount: number;
  description: string;
}

// 分析データの型定義
export interface AnalysisData {
  userId: string;
  period: {
    start: Date;
    end: Date;
  };
  averageLoad: number;
  peakLoad: number;
  patterns: LoadPattern[];
  recommendations: string[];
}

export interface LoadPattern {
  type: 'emotional' | 'activity' | 'intensity';
  trend: 'increasing' | 'decreasing' | 'stable';
  averageValue: number;
}

// 共有設定の型定義
export interface ShareSettings {
  enabled: boolean;
  hideScheduleTitles: boolean;
  shareUrl?: string;
  expiresAt?: Date;
}

