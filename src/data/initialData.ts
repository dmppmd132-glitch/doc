import { User, Document, Department, DepartmentCode, DocType } from '../types/dms';

export const DEPARTMENT_CODES: Record<string, string> = {
  'QA': 'QA',
  'ME': 'ME',
  'PM': 'PM',
};

export const TEAM_MEMBERS: User[] = [
  // 審核主管 (Approver) - 2 人
  {
    id: 'user-01',
    name: '王建國',
    title: 'QA 協理',
    role: 'Approver',
    roleLabel: '審核主管',
    department: 'QA',
    email: 'jk.wang@apex.internal',
    avatarColor: 'bg-indigo-600',
  },
  {
    id: 'user-02',
    name: '李明輝',
    title: 'ME 處長',
    role: 'Approver',
    roleLabel: '審核主管',
    department: 'ME',
    email: 'mh.lee@apex.internal',
    avatarColor: 'bg-purple-600',
  },

  // 撰寫人 (Editor) - 5 人
  {
    id: 'user-03',
    name: '林哲宇',
    title: '資深 ME 工程師',
    role: 'Editor',
    roleLabel: '撰寫人',
    department: 'ME',
    email: 'cy.lin@apex.internal',
    avatarColor: 'bg-blue-600',
  },
  {
    id: 'user-04',
    name: '張雅婷',
    title: '資深 QA 工程師',
    role: 'Editor',
    roleLabel: '撰寫人',
    department: 'QA',
    email: 'yt.chang@apex.internal',
    avatarColor: 'bg-sky-600',
  },
  {
    id: 'user-05',
    name: '趙育誠',
    title: 'ME 製程工程師',
    role: 'Editor',
    roleLabel: '撰寫人',
    department: 'ME',
    email: 'yc.chao@apex.internal',
    avatarColor: 'bg-teal-600',
  },
  {
    id: 'user-06',
    name: '許佩蓉',
    title: '資深 PM 專案經理',
    role: 'Editor',
    roleLabel: '撰寫人',
    department: 'PM',
    email: 'pr.hsu@apex.internal',
    avatarColor: 'bg-emerald-600',
  },
  {
    id: 'user-07',
    name: '郭宗翰',
    title: 'PM 產品專案經理',
    role: 'Editor',
    roleLabel: '撰寫人',
    department: 'PM',
    email: 'th.kuo@apex.internal',
    avatarColor: 'bg-amber-600',
  },

  // 一般員工 (Viewer) - 3 人
  {
    id: 'user-08',
    name: '陳俊霖',
    title: 'ME 組裝技術員',
    role: 'Viewer',
    roleLabel: '一般員工',
    department: 'ME',
    email: 'cl.chen@apex.internal',
    avatarColor: 'bg-slate-600',
  },
  {
    id: 'user-09',
    name: '黃詩涵',
    title: 'QA 檢驗專員',
    role: 'Viewer',
    roleLabel: '一般員工',
    department: 'QA',
    email: 'sh.huang@apex.internal',
    avatarColor: 'bg-zinc-600',
  },
  {
    id: 'user-10',
    name: '吳致遠',
    title: 'PM 專案助理',
    role: 'Viewer',
    roleLabel: '一般員工',
    department: 'PM',
    email: 'cy.wu@apex.internal',
    avatarColor: 'bg-neutral-600',
  },
];

export const INITIAL_DOCUMENTS: Document[] = [
  {
    id: 'doc-001',
    docNumber: 'SOP-QA-001',
    title: '成品出貨檢驗標準作業程序 (OQC Procedures)',
    docType: 'SOP',
    department: 'QA',
    departmentCode: 'QA',
    currentVersion: 'v2.0',
    status: '已生效',
    createdBy: '張雅婷',
    createdById: 'user-04',
    approvedBy: '王建國',
    createdAt: '2026-08-15 10:30',
    updatedAt: '2026-10-20 14:15',
    description: '規範公司各項電子通訊成品出廠前之抽樣率、外觀檢驗、功能測試及防靜電包裝驗收標準。',
    versions: [
      {
        id: 'ver-001-v20',
        docId: 'doc-001',
        docNumber: 'SOP-QA-001',
        version: 'v2.0',
        title: '成品出貨檢驗標準作業程序 (OQC Procedures)',
        revisionSummary: '全面升級防靜電(ESD)袋包裝阻抗規範，抽樣水準調整為 MIL-STD-105E Level II AQL 0.4。',
        file: {
          name: 'SOP-QA-001_v2.0_OQC_Standard.pdf',
          size: '2.4 MB',
          type: 'pdf',
          uploadDate: '2026-10-18 16:40',
        },
        status: '已生效',
        author: '張雅婷',
        authorId: 'user-04',
        submittedAt: '2026-10-18 17:00',
        approver: '王建國',
        approverId: 'user-01',
        reviewComment: '修訂項目符合國際車規客戶稽核要求，已完成抽樣數值驗證，核准發布生效。',
        reviewedAt: '2026-10-20 14:15',
        effectiveAt: '2026-10-20 14:15',
        documentBody: {
          purpose: '本程序旨在確保所有出廠產品之功能特性、外觀品質與包裝標籤均符合客戶合約規範與品質標準。',
          scope: '適用於本公司生產組裝之所有系列邊緣運算模組與工控通訊盒出貨檢驗。',
          responsibilities: [
            '品保部出貨檢驗員 (OQC)：負責按抽樣計畫執行外觀與功能測試，並填寫檢驗報告。',
            '品保部主管：負責審核 OQC 檢驗判定，並對重大異常召開品保評審會議。',
            '生產線生管：依 OQC 合格標籤安排裝箱與物流移交。'
          ],
          procedures: [
            { step: 1, title: '工單資料核對', content: '確認產品型號、客戶專案代碼、出貨數量與生產批號無誤。', keyCheck: '條碼無刮損、序號連號' },
            { step: 2, title: '外觀與機構檢視', content: '在 1000 Lux 照度下檢視鋁合金外殼有無刮傷、碰傷、氧化斑點或印刷毛邊。', keyCheck: '無大於 0.3mm 刮痕' },
            { step: 3, title: '功能與電力開機測控', content: '上電輸入 24V DC 直流電源，檢視 LED 燈號通訊握手，執行自動化燒機測試腳本。', keyCheck: '功耗 < 18W、自檢無代碼' },
            { step: 4, title: 'ESD 靜電袋抽真空封口', content: '放入乾燥劑與濕度指示卡，抽氣至 -0.06 MPa 封口並黏貼合格貼紙。', keyCheck: '阻抗 10^6 ~ 10^9 歐姆' }
          ],
          specTable: [
            { param: '外觀刮傷公差', standard: '無露底材刮痕', tolerance: '長度 < 0.3mm', method: '外觀放大鏡檢驗' },
            { param: '主電源電壓容許範圍', standard: '24.0 V DC', tolerance: '± 5% (22.8 ~ 25.2V)', method: 'FLUKE 數位電表' },
            { param: '絕緣阻抗耐壓', standard: '> 500 MΩ @ 500VDC', tolerance: '漏電流 < 1.0mA', method: 'Chroma 耐壓測試儀' }
          ]
        }
      },
      {
        id: 'ver-001-v10',
        docId: 'doc-001',
        docNumber: 'SOP-QA-001',
        version: 'v1.0',
        title: '成品出貨檢驗標準作業程序 (OQC Procedures)',
        revisionSummary: '初版制定發布，建立基礎抽樣與功能開機程序。',
        file: {
          name: 'SOP-QA-001_v1.0_OQC_Initial.pdf',
          size: '1.8 MB',
          type: 'pdf',
          uploadDate: '2026-08-15 10:00',
        },
        status: '已作廢',
        author: '張雅婷',
        authorId: 'user-04',
        submittedAt: '2026-08-15 10:30',
        approver: '王建國',
        approverId: 'user-01',
        reviewComment: '初版程序符合標準，核准發布。',
        reviewedAt: '2026-08-16 09:30',
        effectiveAt: '2026-08-16 09:30',
      }
    ]
  },
  {
    id: 'doc-002',
    docNumber: 'SPEC-ME-001',
    title: '邊緣 AI 運算加速核心主機板硬體規格書',
    docType: 'SPEC',
    department: 'ME',
    departmentCode: 'ME',
    currentVersion: 'v1.0', // 目前對外生效版本仍為 v1.0
    status: '已生效', // 本身為已生效，但有一筆 v2.0 審核中
    createdBy: '林哲宇',
    createdById: 'user-03',
    approvedBy: '李明輝',
    createdAt: '2026-09-01 11:20',
    updatedAt: '2026-11-10 16:30',
    description: '定義次世代車載 AI 邊緣邊端主機板機構尺寸、供電電路規格、PCIe Gen4 通道分配與散熱熱設計功耗(TDP)。',
    versions: [
      {
        id: 'ver-002-v20',
        docId: 'doc-002',
        docNumber: 'SPEC-ME-001',
        version: 'v2.0',
        title: '邊緣 AI 運算加速核心主機板硬體規格書',
        revisionSummary: '【改版申請】配合客戶散熱改版需求，將工作溫度上限提升至 85°C，新增雙 M.2 NVMe 散熱片間隙尺寸定義。',
        file: {
          name: 'SPEC-RD-001_v2.0_EdgeAI_Board.docx',
          size: '3.6 MB',
          type: 'docx',
          uploadDate: '2026-11-10 16:15',
        },
        status: '審核中', // 審核主管可在此核准或退回
        author: '林哲宇',
        authorId: 'user-03',
        submittedAt: '2026-11-10 16:30',
        approver: null,
        approverId: null,
        reviewComment: null,
        reviewedAt: null,
        effectiveAt: null,
        documentBody: {
          purpose: '提供研發電路設計、機構機構工程與客戶系統整合之正式工程硬體規範與公差標準。',
          scope: '涵蓋主板 PCB 板材、CPU/NPU 供電相數、高速訊號佈線長度及工作環境耐溫標準。',
          responsibilities: [
            '硬體研發團隊：負責各信號完整性 (SI) 與電源完整性 (PI) 實測驗收。',
            '機構工程師：負責確認散熱鰭片高度與機箱外殼干涉檢查。',
            '品保驗證：執行高低溫溫升極限測試。'
          ],
          procedures: [
            { step: 1, title: 'PCB 疊構與板厚驗證', content: '採用 10 層 TG-180 無鹵素材料，板厚標準 1.6mm ± 0.1mm。', keyCheck: '表面沈金厚度 > 2u"' },
            { step: 2, title: '輸入電壓與瞬態突波防護', content: '支援寬電壓 9V ~ 36V DC 輸入，具備 TVS 逆向與高壓突波吸收管。', keyCheck: '耐受 ISO 7637-2 脈衝測試' },
            { step: 3, title: '擴充匯流排通道速率驗收', content: 'PCIe Gen4 x4 高速通道支援最高 16 GT/s 資料吞吐。', keyCheck: 'Eye Diagram 開孔率 > 75%' }
          ],
          specTable: [
            { param: '工作環境溫度', standard: '-20°C ~ +85°C', tolerance: '全速運算無降頻', method: '恆溫恆濕環境艙' },
            { param: '主供電輸出紋波 (Ripple)', standard: '< 30 mVp-p', tolerance: '滿載 60A 條件下', method: '500MHz 示波器' },
            { param: 'PCB 外觀尺寸', standard: '146 mm x 102 mm', tolerance: '± 0.15 mm', method: '2.5D 光學影像測量儀' }
          ]
        }
      },
      {
        id: 'ver-002-v10',
        docId: 'doc-002',
        docNumber: 'SPEC-ME-001',
        version: 'v1.0',
        title: '邊緣 AI 運算加速核心主機板硬體規格書',
        revisionSummary: '初版發布，完成 EVT (工程驗證階段) 規格定義。',
        file: {
          name: 'SPEC-RD-001_v1.0_EdgeAI_EVT.docx',
          size: '3.1 MB',
          type: 'docx',
          uploadDate: '2026-09-01 11:00',
        },
        status: '已生效', // 目前生效版
        author: '林哲宇',
        authorId: 'user-03',
        submittedAt: '2026-09-01 11:20',
        approver: '李明輝',
        approverId: 'user-02',
        reviewComment: 'EVT 階段測試數據完整，准予發布實施。',
        reviewedAt: '2026-09-02 15:00',
        effectiveAt: '2026-09-02 15:00',
        documentBody: {
          purpose: '初版規範建立，適用於 EVT 樣機驗證階段。',
          scope: '全體研發與品保工程師。',
          responsibilities: ['硬體處負責更新維護。'],
          procedures: [
            { step: 1, title: '初始供電測試', content: '常溫 25°C 驗證 12V 供電開機。' }
          ]
        }
      }
    ]
  },
  {
    id: 'doc-003',
    docNumber: 'SOP-ME-002',
    title: 'SMT 表面黏著產線回焊爐溫溫控曲線量測作業標準',
    docType: 'SOP',
    department: 'ME',
    departmentCode: 'ME',
    currentVersion: 'v1.0',
    status: '已生效',
    createdBy: '趙育誠',
    createdById: 'user-05',
    approvedBy: '李明輝',
    createdAt: '2026-09-20 09:10',
    updatedAt: '2026-09-21 17:00',
    description: '規範 SMT 10 溫區熱風回焊爐之測溫板製作、測溫線焊接點位、升溫斜率與液相線以上時間(TAL)。',
    versions: [
      {
        id: 'ver-003-v10',
        docId: 'doc-003',
        docNumber: 'SOP-ME-002',
        version: 'v1.0',
        title: 'SMT 表面黏著產線回焊爐溫溫控曲線量測作業標準',
        revisionSummary: '制定 10 溫區回焊爐溫控程序，明定每日開線前執行熱偶線測溫並產出 KIC 報表。',
        file: {
          name: 'SOP-PR-001_v1.0_SMT_Reflow.pdf',
          size: '4.2 MB',
          type: 'pdf',
          uploadDate: '2026-09-20 09:00',
        },
        status: '已生效',
        author: '趙育誠',
        authorId: 'user-05',
        submittedAt: '2026-09-20 09:10',
        approver: '李明輝',
        approverId: 'user-02',
        reviewComment: '符合無鉛 SAC305 錫膏原廠推薦曲線，准予每日生產執行。',
        reviewedAt: '2026-09-21 17:00',
        effectiveAt: '2026-09-21 17:00',
        documentBody: {
          purpose: '避免因爐溫過高導致零件爆米花效應，或爐溫不足造成冷焊虛焊缺陷。',
          scope: '適用於生產製造部 SMT 產線 A/B/C 三條全自動高速貼片回焊產線。',
          responsibilities: [
            '製程工程師：建立各機種專屬溫控工藝檔案 (PWI)。',
            '產線技術員：每日早班開線前執行實板測溫，PWI 需小於 85% 方可投產。'
          ],
          procedures: [
            { step: 1, title: '熱電偶線固定與校正', content: '使用高溫鋁箔膠帶及紅膠，將 K-type 熱偶固定於 BGA 晶片中心、QFP 引腳及大散熱片基板。', keyCheck: '無接觸不良鬆脫' },
            { step: 2, title: '爐溫分析儀 (KIC) 連線啟動', content: '設定鏈速 85 cm/min，將分析儀置於隔熱箱中，隨測溫板進入爐內。', keyCheck: '隔熱箱最高溫 < 60°C' },
            { step: 3, title: '曲線產出與數據判定', content: '匯出昇溫斜率 (1.5 ~ 2.5°C/s)、Peak 溫度 (240 ~ 248°C) 與 TAL (45 ~ 75s)。', keyCheck: 'PWI 指標 < 85%' }
          ]
        }
      }
    ]
  },
  {
    id: 'doc-004',
    docNumber: '表單-QA-001',
    title: '品質異常處置與矯正預防措施單 (CAR Form)',
    docType: '表單',
    department: 'QA',
    departmentCode: 'QA',
    currentVersion: 'v1.2',
    status: '已生效',
    createdBy: '張雅婷',
    createdById: 'user-04',
    approvedBy: '王建國',
    createdAt: '2026-07-10 14:00',
    updatedAt: '2026-10-05 11:30',
    description: '標準 8D 異常調查表單，涵蓋問題描述、臨時圍堵措施、真因分析(5 Why)、長期改善與結案驗證。',
    versions: [
      {
        id: 'ver-004-v12',
        docId: 'doc-004',
        docNumber: '表單-QA-001',
        version: 'v1.2',
        title: '品質異常處置與矯正預防措施單 (CAR Form)',
        revisionSummary: '新增 D4 真因分析欄位中之魚骨圖分類與數位簽核審批欄位。',
        file: {
          name: 'FORM-QA-001_v1.2_CAR_Template.xlsx',
          size: '520 KB',
          type: 'xlsx',
          uploadDate: '2026-10-04 15:20',
        },
        status: '已生效',
        author: '張雅婷',
        authorId: 'user-04',
        submittedAt: '2026-10-04 15:30',
        approver: '王建國',
        approverId: 'user-01',
        reviewComment: '表單優化完善，方便橫向展開至協力供應商。',
        reviewedAt: '2026-10-05 11:30',
        effectiveAt: '2026-10-05 11:30',
      },
      {
        id: 'ver-004-v11',
        docId: 'doc-004',
        docNumber: '表單-QA-001',
        version: 'v1.1',
        title: '品質異常處置與矯正預防措施單 (CAR Form)',
        revisionSummary: '修正結案有效性追蹤天數由 14 天延長為 30 天。',
        file: {
          name: 'FORM-QA-001_v1.1_CAR_Template.xlsx',
          size: '480 KB',
          type: 'xlsx',
          uploadDate: '2026-08-20 11:00',
        },
        status: '已作廢',
        author: '張雅婷',
        authorId: 'user-04',
        submittedAt: '2026-08-20 11:15',
        approver: '王建國',
        approverId: 'user-01',
        reviewComment: '符合要求，核准升版。',
        reviewedAt: '2026-08-21 10:00',
        effectiveAt: '2026-08-21 10:00',
      }
    ]
  },
  {
    id: 'doc-005',
    docNumber: 'SPEC-ME-002',
    title: 'CAN-FD 車載高速匯流排韌體通訊協定規範書',
    docType: 'SPEC',
    department: 'ME',
    departmentCode: 'ME',
    currentVersion: 'v1.0',
    status: '審核中', // 全新文件送審中
    createdBy: '林哲宇',
    createdById: 'user-03',
    approvedBy: null,
    createdAt: '2026-11-11 09:30',
    updatedAt: '2026-11-11 09:30',
    description: '定義車輛控制單元與微控制器通訊時之 Baud rate 切換機制、CRC 校驗與錯誤重傳規則。',
    versions: [
      {
        id: 'ver-005-v10',
        docId: 'doc-005',
        docNumber: 'SPEC-ME-002',
        version: 'v1.0',
        title: 'CAN-FD 車載高速匯流排韌體通訊協定規範書',
        revisionSummary: '【新發起送審】初版制定，支援 5Mbps 資料段傳輸速率與 64 位元組封包負載規範。',
        file: {
          name: 'SPEC-RD-002_v1.0_CAN_FD_Protocol.pdf',
          size: '1.9 MB',
          type: 'pdf',
          uploadDate: '2026-11-11 09:15',
        },
        status: '審核中',
        author: '林哲宇',
        authorId: 'user-03',
        submittedAt: '2026-11-11 09:30',
        approver: null,
        approverId: null,
        reviewComment: null,
        reviewedAt: null,
        effectiveAt: null,
        documentBody: {
          purpose: '制定次世代車控網關通訊標準，提升訊框通訊吞吐量並符合 ISO 11898-1:2015。',
          scope: '車載系統韌體開發人員、通訊測試工程師。',
          responsibilities: [
            '韌體開發組：嚴格落實通訊訊框 ID 分配與逾時保護機制。',
            '品保驗證：執行故障注入 (Fault Injection) 與匯流排負載率測試。'
          ],
          procedures: [
            { step: 1, title: '實體層收發器電平配置', content: '確認 CAN_H / CAN_L 顯性電平差動為 2.0V ± 0.2V，隱性電平為 0V。', keyCheck: '終端電阻 120 歐姆' },
            { step: 2, title: '仲裁段與資料段位元率配置', content: '仲裁段設定為 500 kbps (取樣點 80%)，資料段切換至 5.0 Mbps (取樣點 75%)。', keyCheck: '無 Bit Stuffing 錯誤' }
          ],
          specTable: [
            { param: '資料段位元傳輸率', standard: '5.0 Mbps', tolerance: '± 0.25%', method: 'Vector CANoe 分析儀' },
            { param: '匯流排空閒偵測時間', standard: '11 Recessive Bits', tolerance: '± 1 Bit', method: '邏輯分析儀' }
          ]
        }
      }
    ]
  },
  {
    id: 'doc-006',
    docNumber: 'SOP-PM-001',
    title: '智慧財產保護與工程研發圖面機密管制辦法',
    docType: 'SOP',
    department: 'PM',
    departmentCode: 'PM',
    currentVersion: 'v1.0',
    status: '已生效',
    createdBy: '許佩蓉',
    createdById: 'user-06',
    approvedBy: '王建國',
    createdAt: '2026-06-01 08:30',
    updatedAt: '2026-06-02 16:00',
    description: '明定研發 3D 圖檔、Gerber 檔、原始碼與技術合約之存取分級、列印浮水印與外發審批程序。',
    versions: [
      {
        id: 'ver-006-v10',
        docId: 'doc-006',
        docNumber: 'SOP-PM-001',
        version: 'v1.0',
        title: '智慧財產保護與工程研發圖面機密管制辦法',
        revisionSummary: '初版制定發布，界定機密等級分為四級（普通、機密、極機密、絕對機密）。',
        file: {
          name: 'SOP-PM-001_v1.0_IP_Security.pdf',
          size: '1.2 MB',
          type: 'pdf',
          uploadDate: '2026-06-01 08:30',
        },
        status: '已生效',
        author: '許佩蓉',
        authorId: 'user-06',
        submittedAt: '2026-06-01 09:00',
        approver: '王建國',
        approverId: 'user-01',
        reviewComment: '符合 ISO 27001 資訊安全政策要求，准予公告。',
        reviewedAt: '2026-06-02 16:00',
        effectiveAt: '2026-06-02 16:00',
        documentBody: {
          purpose: '保障本公司核心技術資產，預防智慧財產外流與非法重製。',
          scope: '全體在職員工、外包廠商與駐點技術人員。',
          responsibilities: [
            '資訊管理處：執行 DLP 資料外洩防護與權限稽核。',
            '各單位主管：負責定期盤點同仁存取權限。'
          ],
          procedures: [
            { step: 1, title: '文件分類標示', content: '所有技術文件右上角須標註機密等級與文件編號。' },
            { step: 2, title: '外發廠商電子加密', content: '外發加工圖面須申請一次性浮水印與效期密碼。' }
          ]
        }
      }
    ]
  },
  {
    id: 'doc-007',
    docNumber: '規範-PM-001',
    title: '客戶工程變更通知 (ECN / ECO) 評估與流轉作業規範',
    docType: '規範',
    department: 'PM',
    departmentCode: 'PM',
    currentVersion: 'v1.0',
    status: '已生效',
    createdBy: '郭宗翰',
    createdById: 'user-07',
    approvedBy: '李明輝',
    createdAt: '2026-08-01 13:40',
    updatedAt: '2026-08-03 10:20',
    description: '規範客戶端提出規格變更時之業務受理、研發評估、成本重新核算與模具切換生效時機。',
    versions: [
      {
        id: 'ver-007-v10',
        docId: 'doc-007',
        docNumber: '規範-PM-001',
        version: 'v1.0',
        title: '客戶工程變更通知 (ECN / ECO) 評估與流轉作業規範',
        revisionSummary: '初版發布，縮短客戶 ECN 內部跨部門評估回覆週期至 48 小時內。',
        file: {
          name: '規範-PM-001_v1.0_ECN_Process.docx',
          size: '2.1 MB',
          type: 'docx',
          uploadDate: '2026-08-01 13:30',
        },
        status: '已生效',
        author: '郭宗翰',
        authorId: 'user-07',
        submittedAt: '2026-08-01 13:40',
        approver: '李明輝',
        approverId: 'user-02',
        reviewComment: '流程明確，跨部門介面清楚，核准實施。',
        reviewedAt: '2026-08-03 10:20',
        effectiveAt: '2026-08-03 10:20',
      }
    ]
  },
  {
    id: 'doc-008',
    docNumber: 'SPEC-QA-002',
    title: '車載系統環境可靠度驗證與高低溫循環測試規範',
    docType: 'SPEC',
    department: 'QA',
    departmentCode: 'QA',
    currentVersion: 'v1.0',
    status: '草稿', // 草稿 (退回)
    createdBy: '張雅婷',
    createdById: 'user-04',
    approvedBy: null,
    createdAt: '2026-11-05 14:00',
    updatedAt: '2026-11-08 17:30',
    description: '定義產品在熱衝擊、低溫冷啟動、鹽霧耐腐蝕與隨機振動環境下之試驗條件與合格判定準則。',
    versions: [
      {
        id: 'ver-008-v10',
        docId: 'doc-008',
        docNumber: 'SPEC-QA-002',
        version: 'v1.0',
        title: '車載系統環境可靠度驗證與高低溫循環測試規範',
        revisionSummary: '初版草稿送審，涵蓋 -40°C ~ 85°C 溫度循環 500 次試驗基準。',
        file: {
          name: 'SPEC-QA-002_v1.0_Reliability_Test.pdf',
          size: '2.8 MB',
          type: 'pdf',
          uploadDate: '2026-11-05 14:00',
        },
        status: '草稿',
        author: '張雅婷',
        authorId: 'user-04',
        submittedAt: '2026-11-05 14:30',
        approver: '王建國',
        approverId: 'user-01',
        reviewComment: '【主管審核退回意見】測試樣品抽樣數應從 5pcs 提升至 12pcs，且電源突波測試未引用 ISO 16750-2 最新條款，請工程師修正後重新送審。',
        reviewedAt: '2026-11-08 17:30',
        effectiveAt: null,
      }
    ]
  }
];
