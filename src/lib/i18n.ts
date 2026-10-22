import type { ModuleKey, RiskLevel } from '@/types/fingerprint';
import type { AdvisorFilter, AdvisorId } from './advisor';

export type Locale = 'en' | 'th';

interface Headline {
  before: string;
  highlight: string;
  after: string;
}

interface AdvisorCopy {
  title: string;
  body: string;
  note: string;
}

export interface Dict {
  header: {
    tagline: string;
    badge: string;
    registry: (count: string) => string;
    rescan: string;
    scanning: string;
  };
  scan: {
    probing: string;
    analyzing: string;
    subtitle: string;
    failed: string;
    retry: string;
    probes: Record<ModuleKey, string>;
  };
  risk: Record<RiskLevel, string>;
  riskLong: Record<RiskLevel, string>;
  hero: {
    tracked: string;
    firstVisit: string;
    lastSeen: (relative: string, count: number) => string;
    firstVisitMeta: string;
    headline: Record<RiskLevel, Headline>;
    bodyRecognized: string;
    bodyFirst: string;
    bodySafe: string;
    gaugeCaption: Record<RiskLevel, string>;
    uniqueAmong: (population: string) => string;
    sharedWith: (count: string) => string;
    entropy: string;
    entropySub: string;
    speed: string;
    speedSub: string;
    hash: string;
    hashSub: string;
  };
  section: {
    title: string;
    subtitle: string;
  };
  cards: {
    gpu: {
      title: string;
      subtitle: string;
      renderer: string;
      webgl: string;
      maxTexture: string;
      antialias: string;
      on: string;
      off: string;
      masked: string;
      canvasStable: string;
      canvasNoisy: string;
      canvasBlocked: string;
      webglBlocked: string;
    };
    env: {
      title: string;
      subtitle: string;
      screen: string;
      colorDepth: (bits: number) => string;
      hardware: string;
      ramNote: string;
      ramHidden: string;
      timezone: string;
      os: string;
      dnt: (enabled: boolean) => string;
      userAgent: string;
      languages: string;
      touch: (points: number) => string;
    };
    audioFonts: {
      title: string;
      subtitle: string;
      oscillator: string;
      stable: string;
      noisy: string;
      audioBlocked: string;
      fontsDetected: string;
      fontsCount: (detected: number, tested: number) => string;
      showMissing: (count: number) => string;
      hideMissing: string;
      noFonts: string;
    };
    inspector: string;
    signals: string;
  };
  takeaway: {
    gpuExposed: (gpu: string) => string;
    gpuMasked: string;
    gpuRandomized: string;
    gpuBlocked: string;
    env: (cohort: string) => string;
    fontsFamily: (family: string) => string;
    fontsRare: (fonts: string) => string;
    fontsNone: string;
    fontsGeneric: string;
  };
  advisor: {
    title: string;
    subtitle: string;
    tabs: Record<AdvisorFilter, string>;
    reduce: (percent: number) => string;
    maxProtection: string;
    recommended: string;
    empty: string;
    ctaTitle: string;
    ctaBody: string;
    ctaButton: string;
    items: Record<AdvisorId, AdvisorCopy>;
  };
  copy: string;
  copied: string;
  footer: string;
}

const th: Dict = {
  header: {
    tagline: 'ระบบตรวจสอบลายนิ้วมือดิจิทัลและรอยเท้าบนเบราว์เซอร์',
    badge: 'Privacy Audit',
    registry: (count) => `ฐานข้อมูลสะสม: ${count} โปรไฟล์`,
    rescan: 'สแกนใหม่อีกครั้ง',
    scanning: 'กำลังสแกน\u2026',
  },
  scan: {
    probing: 'กำลังสแกนลายนิ้วมือดิจิทัลของเบราว์เซอร์\u2026',
    analyzing: 'กำลังคำนวณความเสี่ยงและเทียบกับฐานข้อมูล\u2026',
    subtitle: 'ตรวจ Canvas, การ์ดจอ, ระบบเสียง, ฟอนต์ และสภาพแวดล้อมพร้อมกัน ใช้เวลาไม่ถึง 1 วินาที',
    failed: 'สแกนไม่สำเร็จ',
    retry: 'ลองอีกครั้ง',
    probes: { canvas: 'Canvas', webgl: 'การ์ดจอ', audio: 'ระบบเสียง', env: 'สภาพแวดล้อม', fonts: 'ฟอนต์' },
  },
  risk: { 'High Risk': 'เสี่ยงสูง', Standard: 'ปานกลาง', Safe: 'ปลอดภัย' },
  riskLong: {
    'High Risk': 'ระดับความเสี่ยง: สูงมาก (High Risk)',
    Standard: 'ระดับความเสี่ยง: ปานกลาง (Standard)',
    Safe: 'ระดับความเสี่ยง: ต่ำ (Safe)',
  },
  hero: {
    tracked: 'ระบบจำเครื่องคุณได้โดยไม่ใช้คุกกี้ (Cookieless Tracked)',
    firstVisit: 'บันทึกลายนิ้วมือของเครื่องนี้ครั้งแรก',
    lastSeen: (relative, count) => `ตรวจพบล่าสุด: ${relative} (ตรวจพบเป็นครั้งที่ ${count})`,
    firstVisitMeta: 'ลองเปิดหน้านี้ใหม่ในโหมด Incognito เพื่อทดสอบ',
    headline: {
      'High Risk': { before: 'เบราว์เซอร์นี้มี ', highlight: '\u201cรหัสประจำตัวเฉพาะเครื่อง\u201d', after: ' ที่ปลอมแปลงได้ยาก' },
      Standard: { before: 'เบราว์เซอร์นี้ ', highlight: '\u201cระบุตัวตนได้บางส่วน\u201d', after: ' เมื่อรวมกับข้อมูลอื่น' },
      Safe: { before: 'เบราว์เซอร์นี้ ', highlight: '\u201cกลมกลืนกับผู้ใช้ส่วนใหญ่\u201d', after: ' ติดตามตัวได้ยาก' },
    },
    bodyRecognized:
      'เว็บไซต์ภายนอกสามารถจดจำคุณได้ต่อเนื่องอย่างแม่นยำ แม้คุณจะสลับเข้าสู่โหมดไม่ระบุตัวตน (Incognito) ล้างคุกกี้ทั้งหมด หรือเปลี่ยนเครือข่าย/IP เพราะฮาร์ดแวร์และการเรนเดอร์ของเครื่องคุณเป็นเอกลักษณ์เฉพาะตัว',
    bodyFirst:
      'ระบบเพิ่งบันทึกลักษณะเฉพาะของเครื่องนี้ไว้ ลองรีเฟรชหรือเปิดลิงก์นี้ในโหมด Incognito แล้วคุณจะเห็นว่าเว็บยังจำคุณได้ แม้ไม่มีคุกกี้เลย',
    bodySafe:
      'ลักษณะเครื่องของคุณใกล้เคียงกับผู้ใช้จำนวนมาก หรือเบราว์เซอร์สุ่มค่าเพื่อป้องกันไว้ ทำให้การติดตามแบบไม่ใช้คุกกี้ทำได้ยาก',
    gaugeCaption: { 'High Risk': 'ระบุตัวตนได้เจาะจง', Standard: 'ระบุได้บางส่วน', Safe: 'กลมกลืนกับผู้อื่น' },
    uniqueAmong: (population) => `1 ใน ${population} เครื่อง`,
    sharedWith: (count) => `คล้ายกับอีก ~${count} เครื่อง`,
    entropy: 'ค่าความจำเพาะ (Entropy)',
    entropySub: 'Shannon Entropy',
    speed: 'ความเร็วตรวจจับ',
    speedSub: 'ตรวจได้โดยที่คุณไม่รู้ตัว',
    hash: 'รหัสฮาร์ดแวร์ (Hardware Fingerprint)',
    hashSub: 'SHA-256 Composite Signature',
  },
  section: {
    title: 'ข้อมูลฮาร์ดแวร์และรอยเท้าที่ถูกดึงไป',
    subtitle: '(จำแนกตามส่วนประกอบการประมวลผล)',
  },
  cards: {
    gpu: {
      title: 'กราฟิกและชิป GPU',
      subtitle: 'Canvas 2D & WebGL Architecture',
      renderer: 'ชิปประมวลผล (Unmasked GPU)',
      webgl: 'มาตรฐาน WebGL',
      maxTexture: 'Max Texture Size',
      antialias: 'Anti-aliasing ฮาร์ดแวร์',
      on: 'เปิดใช้งาน (Active)',
      off: 'ปิดอยู่',
      masked: 'ถูกซ่อน (Masked)',
      canvasStable: 'ภาพคงที่ตายตัว',
      canvasNoisy: 'มีการสุ่มสัญญาณรบกวน',
      canvasBlocked: 'การอ่านภาพ Canvas ถูกบล็อก',
      webglBlocked: 'WebGL ถูกปิด จึงไม่เห็นรุ่นการ์ดจอ',
    },
    env: {
      title: 'สภาพแวดล้อมหน้าจอและสเปก',
      subtitle: 'Screen, OS, Timezone & Memory',
      screen: 'ความละเอียดจอ (Screen)',
      colorDepth: (bits) => `Color Depth: ${bits}-bit`,
      hardware: 'ฮาร์ดแวร์ (Hardware)',
      ramNote: 'RAM Bucketed Estimation',
      ramHidden: 'RAM ไม่เปิดเผย',
      timezone: 'โซนเวลา (Timezone)',
      os: 'ระบบปฏิบัติการ (OS)',
      dnt: (enabled) => (enabled ? 'Do Not Track: เปิด' : 'Do Not Track: ปิดอยู่'),
      userAgent: 'User Agent Header',
      languages: 'ภาษาที่รองรับ',
      touch: (points) => (points > 0 ? `จอสัมผัส: ${points} จุด` : 'จอสัมผัส: 0 จุด (Non-Touch)'),
    },
    audioFonts: {
      title: 'เสียงและฟอนต์ที่ติดตั้ง',
      subtitle: 'AudioContext & Font Enumeration',
      oscillator: 'AudioContext Oscillator Simulation',
      stable: 'เสถียร (คงที่)',
      noisy: 'มีการสุ่มค่า',
      audioBlocked: 'ระบบเสียงถูกบล็อก จึงสร้างลายเซ็นไม่ได้',
      fontsDetected: 'ฟอนต์ที่ตรวจพบในเครื่อง',
      fontsCount: (detected, tested) => `${detected} / ${tested} ฟอนต์`,
      showMissing: (count) => `+ ดูอีก ${count} ฟอนต์ที่ไม่พบ`,
      hideMissing: 'ซ่อนฟอนต์ที่ไม่พบ',
      noFonts: 'ไม่พบฟอนต์ทดสอบ เบราว์เซอร์จำกัดการมองเห็นฟอนต์ไว้',
    },
    inspector: 'ดูพารามิเตอร์เชิงลึก',
    signals: 'สัดส่วน Entropy รายสัญญาณ (bits)',
  },
  takeaway: {
    gpuExposed: (gpu) => `ชิป ${gpu} ของคุณทำให้แยกคุณออกจากผู้ใช้อื่นได้ทันที`,
    gpuMasked: 'ชื่อการ์ดจอถูกซ่อนไว้ แต่ภาพ Canvas ยังสร้างลายเซ็นคงที่ได้',
    gpuRandomized: 'เบราว์เซอร์สุ่มสัญญาณรบกวนใน Canvas ไว้ รหัสจึงเปลี่ยนทุกครั้ง',
    gpuBlocked: 'API กราฟิกถูกบล็อก จึงไม่มีลายเซ็นให้ติดตาม',
    env: (cohort) => `หน้าจอ ภาษา และโซนเวลารวมกัน คัดกรองคุณเหลือ 1 ใน ~${cohort} คน`,
    fontsFamily: (family) => `ชุดฟอนต์ตระกูล ${family} บ่งชี้ประเภทเครื่องคอมพิวเตอร์ได้อย่างแม่นยำ`,
    fontsRare: (fonts) => `พบฟอนต์หายาก (${fonts}) ทำให้คุณโดดเด่นจากผู้ใช้ส่วนใหญ่`,
    fontsNone: 'ไม่มีฟอนต์ให้ตรวจ การจำกัดฟอนต์ช่วยปกป้องคุณได้ดี',
    fontsGeneric: 'ชุดฟอนต์ผสมหลายระบบ ทำให้รูปแบบของคุณมีความเฉพาะตัว',
  },
  advisor: {
    title: 'คำแนะนำในการลดการติดตาม (Privacy Hardening)',
    subtitle: 'ขั้นตอนแก้ไขจริงเพื่อลดค่าความเป็นเอกลักษณ์ (Entropy) ให้เบราว์เซอร์ของคุณกลมกลืนกับผู้อื่น',
    tabs: { all: 'ทั้งหมด (All)', firefox: 'Firefox', brave: 'Brave', chromeSafari: 'Chrome / Safari' },
    reduce: (percent) => `\u2212${percent}% ความเฉพาะตัว`,
    maxProtection: 'ปกป้องสูงสุด',
    recommended: 'แนะนำสูงสุด \u2605',
    empty: 'เบราว์เซอร์นี้ไม่มีจุดที่ต้องแก้ไขเพิ่มเติม',
    ctaTitle: 'ทดสอบหลังปรับแต่งค่าของคุณแล้ว',
    ctaBody: 'หลังตั้งค่าเบราว์เซอร์ กดสแกนอีกครั้งเพื่อดูว่าค่า Entropy และรหัส Hash เปลี่ยนไปหรือไม่',
    ctaButton: 'รีเฟรชและสแกนทันที',
    items: {
      firefoxRfp: {
        title: 'เปิดโหมดต้านทาน Fingerprint',
        body: 'บังคับให้เบราว์เซอร์รายงานขนาดหน้าจอ โซนเวลา และค่าระบบเป็นค่ามาตรฐาน พร้อมกันการแอบอ่านภาพ Canvas',
        note: 'พิมพ์ about:config ในช่อง URL แล้วค้นหาค่านี้',
      },
      braveShields: {
        title: 'เปิดการสุ่มลายนิ้วมือ (Farbling)',
        body: 'Brave ใส่สัญญาณรบกวนเล็กน้อยลงใน Canvas, WebGL และ Audio แยกตามเว็บไซต์ ทำให้รหัสไม่ตรงกันข้ามเว็บ',
        note: 'ตั้งค่า Shields \u2192 Block fingerprinting: Strict',
      },
      uniformBrowser: {
        title: 'ใช้เบราว์เซอร์ที่ทุกคนหน้าตาเหมือนกัน',
        body: 'Mullvad และ Tor Browser ทำให้ผู้ใช้ทุกคนมีลายนิ้วมือเหมือนกัน จึงแยกคุณออกจากฝูงชนไม่ได้',
        note: 'ไม่ต้องตั้งค่าเพิ่ม ใช้งานได้ทันที',
      },
      firefoxWebgl: {
        title: 'ซ่อนรุ่นการ์ดจอจาก WebGL',
        body: 'ปิด WebGL หากไม่ได้ใช้เว็บที่แสดงผล 3D หรือแผนที่ เพื่อไม่ให้เว็บอ่านรุ่นชิปกราฟิกได้',
        note: 'about:config \u2192 บางเว็บที่ใช้ 3D อาจแสดงผลไม่ได้',
      },
      firefoxFonts: {
        title: 'จำกัดฟอนต์ที่เว็บมองเห็น',
        body: 'ให้เว็บเห็นเฉพาะฟอนต์พื้นฐานของระบบ ฟอนต์ที่คุณติดตั้งเพิ่มจะไม่ถูกใช้ระบุตัวตน',
        note: 'about:config \u2192 1 = เฉพาะฟอนต์พื้นฐาน',
      },
      safariAfp: {
        title: 'เปิด Advanced Fingerprinting Protection',
        body: 'Safari 17 ขึ้นไปสามารถใส่สัญญาณรบกวนให้ Canvas/Audio และจำกัด API ที่ใช้ระบุตัวตนได้ในทุกการท่องเว็บ',
        note: 'Safari \u2192 Settings \u2192 Advanced',
      },
      chromeBaseline: {
        title: 'ลดความแปลกของ Chrome',
        body: 'Chrome ไม่มีระบบกัน Fingerprint ในตัว ทำได้เพียงใช้ค่าเริ่มต้นให้มากที่สุด: ภาษาเดียว ซูม 100% และไม่ลงฟอนต์แปลก',
        note: 'ถ้าต้องการปกป้องจริงจัง แนะนำย้ายไป Brave',
      },
    },
  },
  copy: 'คัดลอก',
  copied: 'คัดลอกแล้ว',
  footer: 'สื่อการเรียนรู้เชิงสาธิตเรื่อง Browser Fingerprinting ไม่มีการใช้คุกกี้ เก็บเพียงค่าแฮชไว้ในเซิร์ฟเวอร์นี้เพื่อสาธิตการจดจำเครื่อง',
};

const en: Dict = {
  header: {
    tagline: 'Browser fingerprint & tracking footprint audit',
    badge: 'Privacy Audit',
    registry: (count) => `Registry: ${count} profiles`,
    rescan: 'Re-scan browser',
    scanning: 'Scanning\u2026',
  },
  scan: {
    probing: 'Scanning your browser fingerprint\u2026',
    analyzing: 'Scoring risk against the registry\u2026',
    subtitle: 'Canvas, GPU, audio, fonts and environment are probed in parallel. Takes under a second.',
    failed: 'Scan failed',
    retry: 'Try again',
    probes: { canvas: 'Canvas', webgl: 'GPU', audio: 'Audio', env: 'Environment', fonts: 'Fonts' },
  },
  risk: { 'High Risk': 'High risk', Standard: 'Moderate', Safe: 'Safe' },
  riskLong: {
    'High Risk': 'Risk level: High',
    Standard: 'Risk level: Moderate',
    Safe: 'Risk level: Low',
  },
  hero: {
    tracked: 'Recognized without cookies (Cookieless tracked)',
    firstVisit: 'First fingerprint recorded for this device',
    lastSeen: (relative, count) => `Last seen ${relative} (observation #${count})`,
    firstVisitMeta: 'Re-open this page in Incognito to test it',
    headline: {
      'High Risk': { before: 'This browser carries a ', highlight: '\u201cdevice-unique ID\u201d', after: ' that is hard to fake' },
      Standard: { before: 'This browser is ', highlight: '\u201cpartially identifiable\u201d', after: ' when combined with other data' },
      Safe: { before: 'This browser ', highlight: '\u201cblends into the crowd\u201d', after: ' and is hard to track' },
    },
    bodyRecognized:
      'Third-party sites can keep recognizing you even after you switch to Incognito, clear every cookie or change network/IP, because your hardware and rendering stack are unique.',
    bodyFirst:
      'This device was just recorded. Refresh or open this link in an Incognito window and you will see the site still recognizes you, with no cookies at all.',
    bodySafe:
      'Your device looks like many others, or your browser randomizes its output, so cookieless tracking is difficult.',
    gaugeCaption: { 'High Risk': 'Uniquely identifiable', Standard: 'Partially identifiable', Safe: 'Blends in' },
    uniqueAmong: (population) => `1 in ${population} devices`,
    sharedWith: (count) => `Looks like ~${count} others`,
    entropy: 'Identifying entropy',
    entropySub: 'Shannon Entropy',
    speed: 'Detection time',
    speedSub: 'Collected without you noticing',
    hash: 'Hardware fingerprint',
    hashSub: 'SHA-256 composite signature',
  },
  section: {
    title: 'Hardware signals extracted from your browser',
    subtitle: '(grouped by processing component)',
  },
  cards: {
    gpu: {
      title: 'Graphics & GPU',
      subtitle: 'Canvas 2D & WebGL architecture',
      renderer: 'Unmasked GPU',
      webgl: 'WebGL version',
      maxTexture: 'Max texture size',
      antialias: 'Hardware anti-aliasing',
      on: 'Active',
      off: 'Off',
      masked: 'Masked',
      canvasStable: 'Deterministic',
      canvasNoisy: 'Noise injected',
      canvasBlocked: 'Canvas readback is blocked',
      webglBlocked: 'WebGL is disabled, GPU model hidden',
    },
    env: {
      title: 'Display & system',
      subtitle: 'Screen, OS, timezone & memory',
      screen: 'Screen',
      colorDepth: (bits) => `Color depth: ${bits}-bit`,
      hardware: 'Hardware',
      ramNote: 'Bucketed RAM estimate',
      ramHidden: 'RAM not exposed',
      timezone: 'Timezone',
      os: 'Operating system',
      dnt: (enabled) => (enabled ? 'Do Not Track: on' : 'Do Not Track: off'),
      userAgent: 'User-Agent header',
      languages: 'Languages',
      touch: (points) => (points > 0 ? `Touch points: ${points}` : 'Touch points: 0 (non-touch)'),
    },
    audioFonts: {
      title: 'Audio & installed fonts',
      subtitle: 'AudioContext & font enumeration',
      oscillator: 'AudioContext oscillator simulation',
      stable: 'Stable',
      noisy: 'Randomized',
      audioBlocked: 'Audio API blocked, no signature produced',
      fontsDetected: 'Fonts detected on this device',
      fontsCount: (detected, tested) => `${detected} / ${tested} fonts`,
      showMissing: (count) => `+ show ${count} fonts not found`,
      hideMissing: 'Hide fonts not found',
      noFonts: 'No probe fonts visible, font access is restricted',
    },
    inspector: 'Show raw parameters',
    signals: 'Entropy per signal (bits)',
  },
  takeaway: {
    gpuExposed: (gpu) => `Your ${gpu} immediately separates you from other users`,
    gpuMasked: 'GPU name is hidden, but the canvas still renders a stable signature',
    gpuRandomized: 'Your browser injects canvas noise, so the signature changes every time',
    gpuBlocked: 'Graphics APIs are blocked, leaving nothing to track',
    env: (cohort) => `Screen, language and timezone together narrow you to 1 in ~${cohort} people`,
    fontsFamily: (family) => `Your ${family} font set reveals your device type precisely`,
    fontsRare: (fonts) => `Rare fonts found (${fonts}) make you stand out from most users`,
    fontsNone: 'No fonts visible: font restriction is protecting you',
    fontsGeneric: 'A mixed cross-platform font set makes your pattern distinctive',
  },
  advisor: {
    title: 'Privacy hardening',
    subtitle: 'Concrete steps to lower your entropy so your browser blends in with everyone else.',
    tabs: { all: 'All', firefox: 'Firefox', brave: 'Brave', chromeSafari: 'Chrome / Safari' },
    reduce: (percent) => `\u2212${percent}% identifiability`,
    maxProtection: 'Maximum protection',
    recommended: 'Top pick \u2605',
    empty: 'Nothing left to fix for this browser',
    ctaTitle: 'Test your changes',
    ctaBody: 'After changing your browser settings, re-scan to see whether entropy and the hash change.',
    ctaButton: 'Re-scan now',
    items: {
      firefoxRfp: {
        title: 'Enable fingerprinting resistance',
        body: 'Reports standardized screen size, timezone and system values, and blocks silent canvas readback.',
        note: 'Open about:config and search for this pref',
      },
      braveShields: {
        title: 'Turn on fingerprint randomization',
        body: 'Brave adds per-site noise to Canvas, WebGL and Audio so your signature never matches across sites.',
        note: 'Shields \u2192 Block fingerprinting: Strict',
      },
      uniformBrowser: {
        title: 'Use a browser where everyone looks the same',
        body: 'Mullvad and Tor Browser give every user an identical fingerprint, so you cannot be singled out.',
        note: 'No extra configuration required',
      },
      firefoxWebgl: {
        title: 'Hide your GPU from WebGL',
        body: 'Disable WebGL if you do not rely on 3D or map sites, so pages cannot read your graphics chip.',
        note: 'about:config \u2192 some 3D sites may break',
      },
      firefoxFonts: {
        title: 'Limit which fonts sites can see',
        body: 'Expose only the base system fonts, so fonts you installed cannot be used to identify you.',
        note: 'about:config \u2192 1 = base fonts only',
      },
      safariAfp: {
        title: 'Enable Advanced Fingerprinting Protection',
        body: 'Safari 17+ can add noise to Canvas/Audio and restrict identifying APIs for all browsing.',
        note: 'Safari \u2192 Settings \u2192 Advanced',
      },
      chromeBaseline: {
        title: 'Make Chrome less unusual',
        body: 'Chrome has no built-in fingerprint defense. Stick to defaults: one language, 100% zoom, no exotic fonts.',
        note: 'For real protection, consider switching to Brave',
      },
    },
  },
  copy: 'Copy',
  copied: 'Copied',
  footer: 'Educational demo of browser fingerprinting. No cookies are set; only hashed signatures are stored on this server to demonstrate re-identification.',
};

export const translations: Record<Locale, Dict> = { th, en };
