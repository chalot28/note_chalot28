const PI = Math.PI;

const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'] as const;
const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'] as const;

const CHI_HOURS = [
  '23:00–01:00',
  '01:00–03:00',
  '03:00–05:00',
  '05:00–07:00',
  '07:00–09:00',
  '09:00–11:00',
  '11:00–13:00',
  '13:00–15:00',
  '15:00–17:00',
  '17:00–19:00',
  '19:00–21:00',
  '21:00–23:00',
] as const;

// 6 Giờ Hoàng Đạo indices (0..11) for each Day Chi (0=Tý .. 11=Hợi)
const HOANG_DAO_HOURS: readonly (readonly number[])[] = [
  [0, 1, 3, 6, 8, 9], // Tý, Ngọ
  [2, 3, 5, 8, 10, 11], // Sửu, Mùi
  [0, 1, 4, 5, 7, 10], // Dần, Thân
  [0, 2, 3, 6, 7, 9], // Mão, Dậu
  [2, 4, 5, 8, 9, 11], // Thìn, Tuất
  [1, 4, 6, 7, 10, 11], // Tỵ, Hợi
];

// 12 stars of Hoàng Đạo / Hắc Đạo cycle starting from Thanh Long
const TWELVE_STARS = [
  { name: 'Thanh Long', isAuspicious: true },
  { name: 'Minh Đường', isAuspicious: true },
  { name: 'Thiên Hình', isAuspicious: false },
  { name: 'Chu Tước', isAuspicious: false },
  { name: 'Kim Quỹ', isAuspicious: true },
  { name: 'Bảo Quang', isAuspicious: true },
  { name: 'Bạch Hổ', isAuspicious: false },
  { name: 'Ngọc Đường', isAuspicious: true },
  { name: 'Thiên Lao', isAuspicious: false },
  { name: 'Nguyên Vũ', isAuspicious: false },
  { name: 'Tư Mệnh', isAuspicious: true },
  { name: 'Câu Trần', isAuspicious: false },
] as const;

// Starting Day Chi index of Thanh Long for Lunar Month 1..12 (index 0 = Tháng Giêng)
const MONTH_START_CHI = [0, 2, 4, 6, 8, 10, 0, 2, 4, 6, 8, 10] as const;

const TIET_KHI = [
  'Xuân phân',
  'Thanh minh',
  'Cốc vũ',
  'Lập hạ',
  'Tiểu mãn',
  'Mang chủng',
  'Hạ chí',
  'Tiểu thử',
  'Đại thử',
  'Lập thu',
  'Xử thử',
  'Bạch lộ',
  'Thu phân',
  'Hàn lộ',
  'Sương giáng',
  'Lập đông',
  'Tiểu tuyết',
  'Đại tuyết',
  'Đông chí',
  'Tiểu hàn',
  'Đại hàn',
  'Lập xuân',
  'Vũ thủy',
  'Kinh trập',
] as const;

const WEEKDAYS_VI = [
  'Chủ nhật',
  'Thứ hai',
  'Thứ ba',
  'Thứ tư',
  'Thứ năm',
  'Thứ sáu',
  'Thứ bảy',
] as const;

const LUNAR_MONTH_NAMES = [
  'Giêng',
  'Hai',
  'Ba',
  'Tư',
  'Năm',
  'Sáu',
  'Bảy',
  'Tám',
  'Chín',
  'Mười',
  'Một',
  'Chạp',
] as const;

const SOLAR_HOLIDAYS: Record<string, string> = {
  '01-01': 'Tết Dương lịch',
  '02-14': 'Lễ Tình nhân',
  '03-08': 'Quốc tế Phụ nữ',
  '04-30': 'Giải phóng miền Nam',
  '05-01': 'Quốc tế Lao động',
  '06-01': 'Quốc tế Thiếu nhi',
  '09-02': 'Quốc khánh Việt Nam',
  '10-20': 'Phụ nữ Việt Nam',
  '11-20': 'Nhà giáo Việt Nam',
  '12-25': 'Lễ Giáng sinh',
};

const LUNAR_HOLIDAYS: Record<string, string> = {
  '01-01': 'Mùng 1 Tết Nguyên Đán',
  '01-02': 'Mùng 2 Tết Nguyên Đán',
  '01-03': 'Mùng 3 Tết Nguyên Đán',
  '01-15': 'Tết Nguyên Tiêu (Rằm tháng Giêng)',
  '03-03': 'Tết Hàn Thực',
  '03-10': 'Giỗ Tổ Hùng Vương',
  '04-15': 'Lễ Phật Đản',
  '05-05': 'Tết Đoan Ngọ',
  '07-15': 'Lễ Vu Lan (Rằm tháng Bảy)',
  '08-15': 'Tết Trung Thu',
  '10-10': 'Tết Thường Tân',
  '12-23': 'Ông Công Ông Táo chầu trời',
};

export interface LunarDateInfo {
  day: number;
  month: number;
  year: number;
  leap: boolean;
  jd: number;
}

export interface AuspiciousHour {
  chi: string;
  canChi: string;
  range: string;
}

export interface DayFullInfo {
  isoDate: string;
  solar: {
    day: number;
    month: number;
    year: number;
    weekdayName: string;
  };
  lunar: LunarDateInfo & {
    monthName: string;
  };
  canChi: {
    year: string;
    month: string;
    day: string;
  };
  tietKhi: string;
  dayQuality: {
    isHoangDao: boolean;
    label: 'Ngày Hoàng Đạo' | 'Ngày Hắc Đạo';
    starName: string;
  };
  gioHoangDao: AuspiciousHour[];
  holidays: string[];
}

function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd =
    dd +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;
  if (jd < 2299161) {
    jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  }
  return jd;
}

function getNewMoonDay(k: number, timeZone = 7): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = PI / 180;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 = Jd1 + 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 = C1 + 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  const deltat =
    T < -11
      ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
      : -0.000278 + 0.000265 * T + 0.000262 * T2;
  const JdNew = Jd1 + C1 - deltat;
  return Math.floor(JdNew + 0.5 + timeZone / 24);
}

function getSunLongitudeDegrees(jdn: number, timeZone = 7): number {
  const T = (jdn - 2451545.5 - timeZone / 24) / 36525;
  const T2 = T * T;
  const dr = PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let L = L0 + DL;
  L = L - 360 * Math.floor(L / 360);
  return L;
}

function getSunLongitudeSector(jdn: number, timeZone = 7): number {
  return Math.floor(getSunLongitudeDegrees(jdn, timeZone) / 30);
}

function getLunarMonth11(yy: number, timeZone = 7): number {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = Math.floor(off / 29.530588853);
  let nm = getNewMoonDay(k, timeZone);
  const sunLong = getSunLongitudeSector(nm, timeZone);
  if (sunLong >= 9) {
    nm = getNewMoonDay(k - 1, timeZone);
  }
  return nm;
}

function getLeapMonthOffset(a11: number, timeZone = 7): number {
  const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0;
  let i = 1;
  let arc = getSunLongitudeSector(getNewMoonDay(k + i, timeZone), timeZone);
  do {
    last = arc;
    i++;
    arc = getSunLongitudeSector(getNewMoonDay(k + i, timeZone), timeZone);
  } while (arc !== last && i < 14);
  return i - 1;
}

export function convertSolar2Lunar(
  dd: number,
  mm: number,
  yy: number,
  timeZone = 7,
): LunarDateInfo {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1, timeZone);
  if (monthStart > dayNumber) {
    monthStart = getNewMoonDay(k, timeZone);
  }
  let a11 = getLunarMonth11(yy, timeZone);
  let b11 = a11;
  let lunarYear: number;
  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = getLunarMonth11(yy - 1, timeZone);
  } else {
    lunarYear = yy + 1;
    b11 = getLunarMonth11(yy + 1, timeZone);
  }
  const lunarDay = dayNumber - monthStart + 1;
  const diff = Math.floor((monthStart - a11) / 29);
  let lunarLeap = false;
  let lunarMonth = diff + 11;
  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, timeZone);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) {
        lunarLeap = true;
      }
    }
  }
  if (lunarMonth > 12) {
    lunarMonth = lunarMonth - 12;
  }
  if (lunarMonth >= 11 && diff < 4) {
    lunarYear -= 1;
  }
  return {
    day: lunarDay,
    month: lunarMonth,
    year: lunarYear,
    leap: lunarLeap,
    jd: dayNumber,
  };
}

export function parseIsoDate(isoDate: string): { year: number; month: number; day: number } {
  const [yStr, mStr, dStr] = isoDate.split('-');
  const year = Number(yStr);
  const month = Number(mStr);
  const day = Number(dStr);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
  }
  return { year, month, day };
}

export function getDayFullInfo(isoDate: string): DayFullInfo {
  const { year, month, day } = parseIsoDate(isoDate);
  const lunar = convertSolar2Lunar(day, month, year, 7);

  const dateObj = new Date(year, month - 1, day);
  const weekdayName = WEEKDAYS_VI[dateObj.getDay()] ?? '';

  const yearCan = CAN[(lunar.year + 6) % 10]!;
  const yearChi = CHI[(lunar.year + 8) % 12]!;
  const monthCan = CAN[(lunar.year * 12 + lunar.month + 3) % 10]!;
  const monthChi = CHI[(lunar.month + 1) % 12]!;
  const dayCanIdx = (lunar.jd + 9) % 10;
  const dayChiIdx = (lunar.jd + 1) % 12;
  const dayCan = CAN[dayCanIdx]!;
  const dayChi = CHI[dayChiIdx]!;

  // Tiết khí (each 15° of Sun Longitude)
  const sunDeg = getSunLongitudeDegrees(lunar.jd + 0.5, 7);
  const tietKhiIdx = Math.floor(sunDeg / 15) % 24;
  const tietKhi = TIET_KHI[tietKhiIdx] ?? 'Xuân phân';

  // Ngày Hoàng Đạo / Hắc Đạo
  const startChi = MONTH_START_CHI[(lunar.month - 1) % 12] ?? 0;
  const starIdx = (dayChiIdx - startChi + 12) % 12;
  const star = TWELVE_STARS[starIdx]!;

  // Giờ Hoàng Đạo
  const tyHourCanIdx = (dayCanIdx * 2) % 10;
  const auspiciousIndices = HOANG_DAO_HOURS[dayChiIdx % 6] ?? [];
  const gioHoangDao: AuspiciousHour[] = auspiciousIndices.map((chiIdx) => {
    const hourCan = CAN[(tyHourCanIdx + chiIdx) % 10]!;
    const hourChi = CHI[chiIdx]!;
    return {
      chi: hourChi,
      canChi: `${hourCan} ${hourChi}`,
      range: CHI_HOURS[chiIdx]!,
    };
  });

  // Holidays
  const holidays: string[] = [];
  const solarKey = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const lunarKey = `${String(lunar.month).padStart(2, '0')}-${String(lunar.day).padStart(2, '0')}`;
  if (SOLAR_HOLIDAYS[solarKey]) holidays.push(SOLAR_HOLIDAYS[solarKey]!);
  if (!lunar.leap && LUNAR_HOLIDAYS[lunarKey]) holidays.push(LUNAR_HOLIDAYS[lunarKey]!);

  const monthNameBase = LUNAR_MONTH_NAMES[(lunar.month - 1) % 12] ?? String(lunar.month);
  const monthName = lunar.leap ? `${monthNameBase} (Nhuận)` : monthNameBase;

  return {
    isoDate,
    solar: { day, month, year, weekdayName },
    lunar: { ...lunar, monthName },
    canChi: {
      year: `${yearCan} ${yearChi}`,
      month: `${monthCan} ${monthChi}`,
      day: `${dayCan} ${dayChi}`,
    },
    tietKhi,
    dayQuality: {
      isHoangDao: star.isAuspicious,
      label: star.isAuspicious ? 'Ngày Hoàng Đạo' : 'Ngày Hắc Đạo',
      starName: star.name,
    },
    gioHoangDao,
    holidays,
  };
}

export function formatLunarShort(lunar: LunarDateInfo): string {
  if (lunar.day === 1) {
    return `${lunar.day}/${lunar.month}${lunar.leap ? 'N' : ''}`;
  }
  return String(lunar.day);
}
