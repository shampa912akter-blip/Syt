import { Language } from './types';

export const TIMEZONE_OPTIONS = [
  { value: 'Asia/Dhaka', labelEn: 'Asia/Dhaka (UTC+6)', labelBn: 'ঢাকা / বাংলাদেশ (UTC+6)', offsetHours: 6 },
  { value: 'Asia/Kolkata', labelEn: 'Asia/Kolkata (UTC+5:30)', labelBn: 'কলকাতা / ভারত (UTC+5:30)', offsetHours: 5.5 },
  { value: 'UTC', labelEn: 'UTC (Coordinated Universal Time)', labelBn: 'ইউটিসি / আন্তর্জাতিক সময় (UTC)', offsetHours: 0 },
  { value: 'Europe/London', labelEn: 'Europe/London (UTC+0/+1)', labelBn: 'লন্ডন (UTC+0/+1)', offsetHours: 0 },
  { value: 'America/New_York', labelEn: 'America/New York (EST/EDT)', labelBn: 'নিউ ইয়র্ক (EST/EDT)', offsetHours: -5 },
  { value: 'America/Los_Angeles', labelEn: 'America/Los Angeles (PST/PDT)', labelBn: 'লস অ্যাঞ্জেলেস (PST/PDT)', offsetHours: -8 },
  { value: 'Asia/Dubai', labelEn: 'Asia/Dubai (UTC+4)', labelBn: 'দুবাই (UTC+4)', offsetHours: 4 },
  { value: 'Asia/Singapore', labelEn: 'Asia/Singapore (UTC+8)', labelBn: 'সিঙ্গাপুর (UTC+8)', offsetHours: 8 },
] as const;

export function parseDailyTime(dailyTime: string): { hours: number; minutes: number } {
  const [hStr, mStr] = (dailyTime || '10:00').split(':');
  const hours = Math.min(23, Math.max(0, Number.parseInt(hStr || '10', 10) || 0));
  const minutes = Math.min(59, Math.max(0, Number.parseInt(mStr || '0', 10) || 0));
  return { hours, minutes };
}

/**
 * Computes the UTC cron expression (e.g. "0 4 * * *") corresponding to the user's
 * selected dailyTime and timezone offset.
 */
export function getUtcCronExpression(dailyTime: string, timezone: string): string {
  const { hours, minutes } = parseDailyTime(dailyTime);
  const tzEntry = TIMEZONE_OPTIONS.find((tz) => tz.value === timezone);
  const offsetHours = tzEntry ? tzEntry.offsetHours : 0;

  let totalMinutesUtc = hours * 60 + minutes - Math.round(offsetHours * 60);
  totalMinutesUtc = ((totalMinutesUtc % 1440) + 1440) % 1440;

  const utcHour = Math.floor(totalMinutesUtc / 60);
  const utcMinute = totalMinutesUtc % 60;
  return `${utcMinute} ${utcHour} * * *`;
}

/**
 * Returns the next Date for index-th pending video (0 = next run, 1 = +1 day, etc.)
 * based on current time and the configured timezone/dailyTime.
 */
export function getScheduledDateForQueueIndex(
  index: number,
  dailyTime: string,
  timezone: string,
  now: Date = new Date()
): Date {
  const { hours, minutes } = parseDailyTime(dailyTime);

  // Determine current local date parts in the selected timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone || 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => Number.parseInt(parts.find((p) => p.type === type)?.value || '0', 10);

  const curHour = getPart('hour') % 24;
  const curMinute = getPart('minute');

  const tzEntry = TIMEZONE_OPTIONS.find((tz) => tz.value === timezone);
  const offsetMs = (tzEntry ? tzEntry.offsetHours : 0) * 3600 * 1000;

  // Build UTC midnight for the timezone's today, then add target time minus offset
  const tzNowMs = now.getTime() + offsetMs;
  const tzNow = new Date(tzNowMs);
  const targetLocalTodayMs = Date.UTC(
    tzNow.getUTCFullYear(),
    tzNow.getUTCMonth(),
    tzNow.getUTCDate(),
    hours,
    minutes,
    0,
    0
  );

  const hasPassedToday = curHour > hours || (curHour === hours && curMinute >= minutes);
  const dayOffset = (hasPassedToday ? 1 : 0) + index;

  return new Date(targetLocalTodayMs - offsetMs + dayOffset * 86400 * 1000);
}

export function formatScheduledDateTime(
  date: Date,
  timezone: string,
  lang: Language
): string {
  const locale = lang === 'bn' ? 'bn-BD' : 'en-US';
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: timezone || 'UTC',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return date.toLocaleString(locale);
  }
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb < 1) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${mb.toFixed(1)} MB`;
}

export function formatDuration(seconds?: number): string {
  if (!seconds || !Number.isFinite(seconds)) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
