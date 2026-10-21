export type Locale = 'en' | 'th';

export interface TranslationDict {
  brand: {
    title: string;
    tagline: string;
    versionBadge: string;
    statelessTelemetry: string;
  };
  actions: {
    rescan: string;
    scanning: string;
    analyzing: string;
    copy: string;
    copied: string;
    tryAgain: string;
    reScanNow: string;
  };
  statelessBanner: {
    activeBadge: string;
    firstVisitBadge: string;
    hardwareMatched: string;
    baselineCaptured: string;
    recognizedTitle: (visitCount: number) => string;
    firstVisitTitle: string;
    recognizedDesc: (relative: string, date: string) => string;
    firstVisitDesc: string;
    hardwareHashLabel: string;
    observationLabel: string;
    firstObservation: string;
    visitObservations: (count: number) => string;
  };
  metrics: {
    uniqueness: string;
    cohortEstimate: (anonymitySize: string) => string;
    totalEntropy: string;
    bits: string;
    entropyDesc: (candidates: string) => string;
    identifyingStrength: string;
    strengthLevels: {
      extreme: string;
      high: string;
      moderate: string;
    };
    masterHash: string;
    sha256Digest: string;
    masterHashDesc: string;
    scanLatency: string;
    probesEvaluated: string;
    serverAuditTime: string;
    verifiedStateless: string;
  };
  probesSection: {
    title: string;
    subtitle: string;
    legend: {
      label: string;
      safe: string;
      standard: string;
      highRisk: string;
    };
    modules: {
      canvas: {
        title: string;
        short: string;
        subtitle: string;
        dataUrlSize: string;
        stability: string;
        winding: string;
        preview: string;
        randomized: string;
        deterministic: string;
        supported: string;
        unsupported: string;
      };
      webgl: {
        title: string;
        short: string;
        subtitle: string;
        unmaskedRenderer: string;
        vendor: string;
        context: string;
        version: string;
        glsl: string;
        extensions: string;
        maxTexture: string;
        maxViewport: string;
        renderbuffer: string;
        antialias: string;
        paramHash: string;
        enabled: string;
        disabled: string;
      };
      audio: {
        title: string;
        short: string;
        subtitle: string;
        renderedBuffer: string;
        sampleSum: string;
        signature: string;
        stability: string;
      };
      env: {
        title: string;
        short: string;
        subtitle: string;
        screen: string;
        available: string;
        colorDepth: string;
        pixelRatio: string;
        cpuThreads: string;
        memory: string;
        timezone: string;
        languages: string;
        platform: string;
        touchPoints: string;
        doNotTrack: string;
        cookies: string;
        userAgent: string;
        declared: (count: number) => string;
      };
      fonts: {
        title: string;
        short: string;
        subtitle: (detected: number, tested: number) => string;
        detectedCount: string;
        rareBadge: string;
      };
    };
    weight: string;
    entropyLabel: string;
    signalsEmpty: string;
    averageMarker: string;
  };
  advisor: {
    title: string;
    subtitle: string;
    filterAll: string;
    filterHigh: string;
    filterStandard: string;
    filterSafe: string;
    emptyFiltered: string;
    actionsHeading: string;
    copyFlag: string;
    ctaHeadline: string;
    ctaSub: string;
  };
  footer: {
    disclaimer: string;
  };
}

export const translations: Record<Locale, TranslationDict> = {
  en: {
    brand: {
      title: 'CyberScan Fingerprint',
      tagline: 'Stateless Hardware Identification & Shannon Entropy Profiling',
      versionBadge: 'Production MVP',
      statelessTelemetry: 'Stateless Non-Cookie Telemetry',
    },
    actions: {
      rescan: 'Re-Scan Browser',
      scanning: 'Scanning Probes...',
      analyzing: 'Evaluating Entropy...',
      copy: 'Copy',
      copied: 'Copied',
      tryAgain: 'Try Again',
      reScanNow: 'Re-Scan Now',
    },
    statelessBanner: {
      activeBadge: 'Stateless Re-Identification Active',
      firstVisitBadge: 'First Hardware Baseline Recorded',
      hardwareMatched: 'Hardware matched via cross-attribute signature',
      baselineCaptured: 'Hardware profile captured in stateless engine',
      recognizedTitle: (count) => `Recognized Without Cookies (Observation #${count})`,
      firstVisitTitle: 'No Prior Device Match Found in Registry',
      recognizedDesc: (relative, date) =>
        `Even in Incognito/Private mode, with all cookies wiped or IP rotated, your hardware artifacts matched the exact profile first observed ${relative} (${date}).`,
      firstVisitDesc:
        'Your mathematical hardware fingerprint has been logged into the stateless tracking engine. If you refresh or reopen this in an Incognito window, the scanner will re-identify you instantly without cookies.',
      hardwareHashLabel: 'Hardware Signature Hash',
      observationLabel: 'Stateless Recognition',
      firstObservation: 'Initial Baseline',
      visitObservations: (count) => `${count} Matches`,
    },
    metrics: {
      uniqueness: 'Uniqueness Probability',
      cohortEstimate: (anonymitySize) => `Cohort: ~1 in ${anonymitySize} browsers in reference sample`,
      totalEntropy: 'Total Shannon Entropy',
      bits: 'bits',
      entropyDesc: (candidates) =>
        `Statistically capable of isolating 1 profile out of ${candidates} candidates without external identifiers.`,
      identifyingStrength: 'Identifying Strength',
      strengthLevels: {
        extreme: 'Singular Identity',
        high: 'High Confidence',
        moderate: 'Broad Cohort',
      },
      masterHash: 'Composite Fingerprint Hash',
      sha256Digest: 'SHA-256 Digest',
      masterHashDesc: 'Synthesized from 2D Canvas, WebGL, AudioContext, Font enumeration and Environment attributes.',
      scanLatency: 'Probe Execution Latency',
      probesEvaluated: 'Probes Evaluated:',
      serverAuditTime: 'Server Audit Timestamp:',
      verifiedStateless: 'Verified Cookie-Free Scan',
    },
    probesSection: {
      title: 'Extracted Hardware Signatures',
      subtitle: 'Individual risk assessment, extracted hardware attributes, and entropy contribution per probe.',
      legend: {
        label: 'Risk Classification:',
        safe: 'Safe',
        standard: 'Standard',
        highRisk: 'High Risk',
      },
      modules: {
        canvas: {
          title: 'Canvas 2D Rendering',
          short: 'Canvas',
          subtitle: 'Sub-pixel geometry · text rasterization · emoji rendering',
          dataUrlSize: 'Data URL Length',
          stability: 'Output Determinism',
          winding: 'Even-Odd Winding',
          preview: 'Raw Header Preview',
          randomized: 'Noise Injected',
          deterministic: 'Deterministic Hash',
          supported: 'Supported',
          unsupported: 'Unsupported',
        },
        webgl: {
          title: 'WebGL GPU Architecture',
          short: 'WebGL',
          subtitle: 'WEBGL_debug_renderer_info · capability limits · precision',
          unmaskedRenderer: 'Unmasked Hardware Renderer',
          vendor: 'Vendor',
          context: 'Context API',
          version: 'Driver Version',
          glsl: 'GLSL Version',
          extensions: 'Active Extensions',
          maxTexture: 'Max Texture Size',
          maxViewport: 'Max Viewport Dims',
          renderbuffer: 'Renderbuffer Size',
          antialias: 'Hardware Antialiasing',
          paramHash: 'Capability Param Hash',
          enabled: 'Enabled',
          disabled: 'Disabled',
        },
        audio: {
          title: 'AudioContext DSP Pipeline',
          short: 'Audio',
          subtitle: 'OfflineAudioContext · oscillator → dynamics compressor',
          renderedBuffer: 'Rendered Audio Buffer',
          sampleSum: 'Sum of Floating Samples',
          signature: 'DSP Output Hash',
          stability: 'Buffer Stability',
        },
        env: {
          title: 'Host System Environment',
          short: 'Environment',
          subtitle: 'Display geometry · system concurrency · locale stack',
          screen: 'Resolution',
          available: 'Usable Desktop',
          colorDepth: 'Color Depth',
          pixelRatio: 'Pixel Ratio',
          cpuThreads: 'CPU Cores',
          memory: 'RAM Estimate',
          timezone: 'Timezone',
          languages: 'Language Stack',
          platform: 'OS Platform',
          touchPoints: 'Max Touch Points',
          doNotTrack: 'Do Not Track',
          cookies: 'Cookie Engine',
          userAgent: 'User Agent String',
          declared: (count) => `${count} declared`,
        },
        fonts: {
          title: 'Installed System Fonts',
          short: 'Fonts',
          subtitle: (detected, tested) => `${detected} of ${tested} probe fonts detected via baseline glyph metrics`,
          detectedCount: 'Fonts Detected',
          rareBadge: 'Rare Font',
        },
      },
      weight: 'Module Weight',
      entropyLabel: 'Entropy',
      signalsEmpty: 'No identifying signals were extracted from this probe.',
      averageMarker: 'Population Average',
    },
    advisor: {
      title: 'Privacy Hardening Advisor',
      subtitle: 'Deterministic counter-measures and browser hardening steps tailored to your leak profile.',
      filterAll: 'All Priorities',
      filterHigh: 'High Priority',
      filterStandard: 'Standard',
      filterSafe: 'Baseline',
      emptyFiltered: 'No hardening recommendations found for this priority level.',
      actionsHeading: 'Hardening Instructions',
      copyFlag: 'Copy Setting',
      ctaHeadline: 'Verify your hardened browser profile',
      ctaSub: 'Apply configuration changes in your browser and trigger a live re-scan to measure reduction in entropy.',
    },
    footer: {
      disclaimer: 'Educational demonstration of client-side browser fingerprinting and stateless tracking mechanisms. Zero cookies or persistent local tokens are utilized.',
    },
  },
  th: {
    brand: {
      title: 'CyberScan Fingerprint',
      tagline: 'ระบบสแกนลายนิ้วมือดิจิทัลและการติดตามตัวตนแบบไร้คุกกี้',
      versionBadge: 'ระบบพร้อมใช้งาน',
      statelessTelemetry: 'ระบบตรวจสอบแบบไร้คุกกี้ 100%',
    },
    actions: {
      rescan: 'สแกนเบราว์เซอร์ใหม่',
      scanning: 'กำลังตรวจจับฮาร์ดแวร์...',
      analyzing: 'กำลังคำนวณ Shannon Entropy...',
      copy: 'คัดลอก',
      copied: 'คัดลอกแล้ว',
      tryAgain: 'ลองใหม่อีกครั้ง',
      reScanNow: 'เริ่มสแกนใหม่ทันที',
    },
    statelessBanner: {
      activeBadge: 'ระบบจดจำคุณได้สำเร็จ (ไร้คุกกี้)',
      firstVisitBadge: 'บันทึกอัตลักษณ์ฮาร์ดแวร์ครั้งแรก',
      hardwareMatched: 'ระบุตัวตนสำเร็จผ่านลายเซ็นฮาร์ดแวร์ข้ามแอตทริบิวต์',
      baselineCaptured: 'บันทึกรอยเท้าฮาร์ดแวร์เข้าสู่ระบบเรียบร้อย',
      recognizedTitle: (count) => `ระบบจำเครื่องคุณได้โดยไม่ใช้คุกกี้ (ตรวจพบเป็นครั้งที่ #${count})`,
      firstVisitTitle: 'ไม่พบประวัติฮาร์ดแวร์นี้ในฐานข้อมูลมาก่อน',
      recognizedDesc: (relative, date) =>
        `แม้คุณจะเปิดโหมดไม่ระบุตัวตน (Incognito), ล้างคุกกี้ทั้งหมด หรือเปลี่ยน IP ลายเซ็นฮาร์ดแวร์เครื่องนี้ก็ยังตรงกับประวัติที่เคยพบเมื่อ ${relative} (${date}) อยู่ดี`,
      firstVisitDesc:
        'อัตลักษณ์ฮาร์ดแวร์ของคุณถูกบันทึกเข้าสู่ระบบแล้ว หากคุณรีเฟรชหน้าเว็บหรือลองเปิดลิงก์นี้ในโหมด Incognito ระบบจะจำคุณได้ทันทีโดยไม่พึ่งพาคุกกี้',
      hardwareHashLabel: 'รหัสแฮชฮาร์ดแวร์ (Hardware Hash)',
      observationLabel: 'การตรวจจับสถานะ',
      firstObservation: 'บันทึกครั้งแรก',
      visitObservations: (count) => `พบแล้ว ${count} ครั้ง`,
    },
    metrics: {
      uniqueness: 'โอกาสไม่ซ้ำใคร (Uniqueness Score)',
      cohortEstimate: (anonymitySize) => `กลุ่มตัวอย่าง: พบเพียง ~1 ใน ${anonymitySize} เบราว์เซอร์`,
      totalEntropy: 'ค่าความจำเพาะตัวตน (Total Entropy)',
      bits: 'บิต',
      entropyDesc: (candidates) =>
        `มีพลังทางสถิติในการชี้ตัวตนเหลือเพียง 1 คนจากกลุ่มเป้าหมาย ${candidates} คนได้ทันที`,
      identifyingStrength: 'ระดับความสามารถในการชี้ตัว',
      strengthLevels: {
        extreme: 'ระบุตัวตนได้เด็ดขาด',
        high: 'ความมั่นใจสูงมาก',
        moderate: 'กลุ่มทั่วไป',
      },
      masterHash: 'รหัสลายนิ้วมือดิจิทัลรวม (Master Hash)',
      sha256Digest: 'ค่าสรุปผล SHA-256',
      masterHashDesc: 'คำนวณจาก Canvas 2D, การ์ดจอ WebGL, Audio DSP, ชุดฟอนต์ในเครื่อง และข้อมูลเบราว์เซอร์',
      scanLatency: 'ความเร็วในการตรวจจับ',
      probesEvaluated: 'จำนวนการทดสอบที่รัน:',
      serverAuditTime: 'เวลาที่เซิร์ฟเวอร์ประเมินผล:',
      verifiedStateless: 'การันตีสแกนสดไร้คุกกี้',
    },
    probesSection: {
      title: 'ข้อมูลฮาร์ดแวร์และรอยเท้าที่ถูกสกัด',
      subtitle: 'ผลประเมินระดับความเสี่ยง รอยเท้าฮาร์ดแวร์ที่ตรวจพบ และสัดส่วน Entropy ในแต่ละด้าน',
      legend: {
        label: 'ระดับความเสี่ยง:',
        safe: 'ปลอดภัย',
        standard: 'ปกติ',
        highRisk: 'เสี่ยงสูง',
      },
      modules: {
        canvas: {
          title: 'Canvas 2D Rendering',
          short: 'Canvas',
          subtitle: 'การเกลี่ยสีพิกเซล · การวาดขอบตัวอักษร · การประมวลผล Emoji',
          dataUrlSize: 'ขนาดข้อมูลรูปภาพ',
          stability: 'ความคงที่ของภาพ',
          winding: 'Even-Odd Winding',
          preview: 'พรีวิวข้อมูลดิบ',
          randomized: 'มีการสุ่มสัญญาณรบกวน (ปลอดภัย)',
          deterministic: 'ภาพวาดคงที่ตายตัว (เสี่ยง)',
          supported: 'รองรับ',
          unsupported: 'ไม่รองรับ',
        },
        webgl: {
          title: 'WebGL สถาปัตยกรรมการ์ดจอ',
          short: 'WebGL',
          subtitle: 'WEBGL_debug_renderer_info · ขีดจำกัด GPU · ค่าความแม่นยำ Shader',
          unmaskedRenderer: 'รุ่นการ์ดจอที่ถูกเปิดเผย',
          vendor: 'ผู้ผลิตชิป',
          context: 'ประเภท Context',
          version: 'เวอร์ชันไดรเวอร์',
          glsl: 'เวอร์ชัน GLSL',
          extensions: 'Extensions ที่เปิดใช้',
          maxTexture: 'ขนาด Texture สูงสุด',
          maxViewport: 'ขนาด Viewport สูงสุด',
          renderbuffer: 'ขนาด Renderbuffer',
          antialias: 'ฮาร์ดแวร์ Antialias',
          paramHash: 'แฮชคุณสมบัติกราฟิก',
          enabled: 'เปิดใช้งาน',
          disabled: 'ปิดใช้งาน',
        },
        audio: {
          title: 'AudioContext ระบบเสียงสังเคราะห์',
          short: 'Audio',
          subtitle: 'OfflineAudioContext · Oscillator คลื่นสามเหลี่ยม → Dynamics Compressor',
          renderedBuffer: 'คลื่นเสียงที่สังเคราะห์ได้',
          sampleSum: 'ผลรวมตัวเลขทศนิยมเสียง',
          signature: 'รหัสแฮชผลลัพธ์ DSP',
          stability: 'ความเสถียรของคลื่นเสียง',
        },
        env: {
          title: 'สภาพแวดล้อมและข้อมูลอุปกรณ์',
          short: 'สภาพแวดล้อม',
          subtitle: 'ความละเอียดหน้าจอ · จำนวนแกน CPU · การตั้งค่าภาษาและภูมิภาค',
          screen: 'ความละเอียดจอ',
          available: 'พื้นที่จอใช้งานจริง',
          colorDepth: 'ความลึกของสี',
          pixelRatio: 'อัตราส่วนพิกเซล',
          cpuThreads: 'จำนวนคอร์ CPU',
          memory: 'หน่วยความจำ RAM',
          timezone: 'โซนเวลา',
          languages: 'ภาษาที่รองรับ',
          platform: 'ระบบปฏิบัติการ',
          touchPoints: 'จุดสัมผัสหน้าจอ',
          doNotTrack: 'โหมด Do Not Track',
          cookies: 'การรองรับคุกกี้',
          userAgent: 'ข้อความ User Agent',
          declared: (count) => `ระบุไว้ ${count} ภาษา`,
        },
        fonts: {
          title: 'ฟอนต์ที่ติดตั้งอยู่ในเครื่อง',
          short: 'ฟอนต์',
          subtitle: (detected, tested) => `ตรวจพบ ${detected} จาก ${tested} ฟอนต์ทดสอบ ผ่านการวัดความกว้างของตัวอักษร`,
          detectedCount: 'ฟอนต์ที่พบในเครื่อง',
          rareBadge: 'ฟอนต์หายาก',
        },
      },
      weight: 'น้ำหนักความสำคัญ',
      entropyLabel: 'ค่า Entropy',
      signalsEmpty: 'ไม่พบสัญญาณที่ระบุตัวตนได้จากการทดสอบนี้',
      averageMarker: 'ค่าเฉลี่ยประชากรทั่วไป',
    },
    advisor: {
      title: 'คำแนะนำการเสริมความปลอดภัย (Privacy Hardening)',
      subtitle: 'ขั้นตอนการปรับแต่งเบราว์เซอร์เพื่อลดรอยเท้าดิจิทัลตามจุดที่ตรวจพบความเสี่ยงในเครื่องคุณ',
      filterAll: 'ความสำคัญทั้งหมด',
      filterHigh: 'ต้องแก้ไขด่วน',
      filterStandard: 'ระดับมาตรฐาน',
      filterSafe: 'ระดับพื้นฐาน',
      emptyFiltered: 'ไม่พบคำแนะนำในหมวดหมู่ที่เลือก',
      actionsHeading: 'คำแนะนำการตั้งค่า',
      copyFlag: 'คัดลอกค่าการตั้งค่า',
      ctaHeadline: 'ทดสอบหลังปรับแต่งการตั้งค่าเบราว์เซอร์',
      ctaSub: 'หลังจากเปลี่ยนการตั้งค่าในเบราว์เซอร์ของคุณแล้ว ลองกดสแกนใหม่อีกครั้งเพื่อดูว่าค่า Entropy ลดลงหรือไม่',
    },
    footer: {
      disclaimer: 'สื่อการเรียนรู้เชิงสาธิตเรื่อง Browser Fingerprinting และการติดตามตัวตนแบบไร้คุกกี้ ไม่มีการเก็บคุกกี้หรือข้อมูลส่วนบุคคลใดๆ',
    },
  },
};
