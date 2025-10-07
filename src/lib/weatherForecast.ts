import { Schedule, WeatherIcon, WeatherForecast, LoadData } from '@/types';

/**
 * 負荷データから単一の負荷スコアを計算
 */
export function calculateLoadScore(load: LoadData): number {
  // 感情の絶対値と強度を考慮
  const emotionalImpact = Math.abs(load.emotional) * load.intensity;
  const activityImpact = Math.abs(load.activity) * load.intensity;
  
  // ネガティブな感情はより重く扱う
  const emotionalWeight = load.emotional < 0 ? 1.5 : 1.0;
  
  return (emotionalImpact * emotionalWeight + activityImpact) * load.intensity;
}

/**
 * 複数のスケジュールから合計負荷を計算
 */
export function calculateTotalLoad(schedules: Schedule[]): number {
  return schedules.reduce((total, schedule) => {
    return total + calculateLoadScore(schedule.load);
  }, 0);
}

/**
 * 負荷スコアから天気アイコンを決定
 */
export function getWeatherIcon(totalLoad: number, scheduleCount: number): WeatherIcon {
  // スケジュールがない場合は快晴
  if (scheduleCount === 0) {
    return '☀️';
  }

  // 平均負荷を計算
  const averageLoad = totalLoad / scheduleCount;
  
  if (averageLoad < 0.3) {
    return '☀️'; // 快晴
  } else if (averageLoad < 0.5) {
    return '🌤️'; // 晴れ時々曇り
  } else if (averageLoad < 0.7) {
    return '☁️'; // 曇り
  } else if (averageLoad < 0.9) {
    return '🌧️'; // 雨
  } else {
    return '⛈️'; // 雷雨
  }
}

/**
 * 天気アイコンから説明文を生成
 */
export function getWeatherDescription(weather: WeatherIcon, totalLoad: number, scheduleCount: number): string {
  const descriptions: Record<WeatherIcon, string> = {
    '☀️': 'キャパシティに余裕があります。新しいタスクに取り組むのに最適な日です。',
    '🌤️': '適度な負荷です。計画的に進めれば問題ありません。',
    '☁️': 'やや負荷が高めです。重要なタスクは午前中に済ませましょう。',
    '🌧️': '負荷が高い日です。無理のない範囲でタスクを調整することをお勧めします。',
    '⛈️': 'キャパシティオーバーの危険があります。予定の見直しを強く推奨します。',
  };

  return descriptions[weather];
}

/**
 * 指定日のスケジュールから天気予報を生成
 */
export function generateWeatherForecast(
  date: Date,
  schedules: Schedule[]
): WeatherForecast {
  const totalLoad = calculateTotalLoad(schedules);
  const weather = getWeatherIcon(totalLoad, schedules.length);
  const description = getWeatherDescription(weather, totalLoad, schedules.length);

  return {
    date,
    weather,
    totalLoad,
    scheduleCount: schedules.length,
    description,
  };
}

/**
 * 日付範囲のスケジュールを日別にグループ化
 */
export function groupSchedulesByDate(schedules: Schedule[]): Map<string, Schedule[]> {
  const grouped = new Map<string, Schedule[]>();

  schedules.forEach((schedule) => {
    const dateKey = schedule.date.toISOString().split('T')[0];
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(schedule);
  });

  return grouped;
}

/**
 * 複数日の天気予報を生成
 */
export function generateWeekForecast(
  startDate: Date,
  days: number,
  schedules: Schedule[]
): WeatherForecast[] {
  const forecasts: WeatherForecast[] = [];
  const groupedSchedules = groupSchedulesByDate(schedules);

  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);
    const dateKey = currentDate.toISOString().split('T')[0];
    
    const daySchedules = groupedSchedules.get(dateKey) || [];
    const forecast = generateWeatherForecast(currentDate, daySchedules);
    forecasts.push(forecast);
  }

  return forecasts;
}

/**
 * 最適なタスク実行日を提案
 */
export function suggestOptimalDates(
  forecasts: WeatherForecast[],
  taskLoad: LoadData,
  count: number = 3
): Date[] {
  const taskScore = calculateLoadScore(taskLoad);
  
  // 各日の予想負荷を計算し、タスクを追加した場合の負荷を算出
  const datesWithScore = forecasts.map((forecast) => {
    const newTotalLoad = forecast.totalLoad + taskScore;
    const newCount = forecast.scheduleCount + 1;
    const newAverageLoad = newTotalLoad / newCount;
    
    return {
      date: forecast.date,
      score: newAverageLoad,
      currentLoad: forecast.totalLoad,
    };
  });

  // 負荷が低い順にソート
  datesWithScore.sort((a, b) => a.score - b.score);

  // 上位N件の日付を返す
  return datesWithScore.slice(0, count).map((item) => item.date);
}

/**
 * 週間の平均負荷を計算
 */
export function calculateAverageLoad(forecasts: WeatherForecast[]): number {
  if (forecasts.length === 0) return 0;
  
  const totalLoad = forecasts.reduce((sum, forecast) => sum + forecast.totalLoad, 0);
  return totalLoad / forecasts.length;
}

/**
 * ピーク負荷の日を特定
 */
export function findPeakLoadDay(forecasts: WeatherForecast[]): WeatherForecast | null {
  if (forecasts.length === 0) return null;
  
  return forecasts.reduce((peak, current) => 
    current.totalLoad > peak.totalLoad ? current : peak
  );
}

