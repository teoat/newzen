export type Node = {
  id: string;
  label: string;
  type: 'person' | 'company' | 'bank' | 'unknown';
  risk: number;
  x: number;
  y: number;
};

export type Link = {
  source: string;
  target: string;
  value: number;
  type: string;
};

export const HOLOGRAPHIC_SOURCE = {
  nexus: {
    nodes: [
      { id: 'proj_alpha', label: 'PROJECT ALPHA (ROOT)', type: 'bank', risk: 0.1, x: 50, y: 50 },
      { id: 'contractor_1', label: 'PT. SINAR KONSTRUKSI', type: 'company', risk: 0.85, x: 30, y: 30 },
      { id: 'subcon_x', label: 'CV. MAJU JAYA (ALDI)', type: 'company', risk: 0.95, x: 20, y: 60 },
      { id: 'bank_offshore', label: 'VALLEY TRUST BANK', type: 'bank', risk: 0.6, x: 70, y: 20 },
      { id: 'director_p', label: 'BAMBANG P. (DIRECTOR)', type: 'person', risk: 0.7, x: 80, y: 70 },
      { id: 'shell_entity', label: 'SHELL SERVICES LTD', type: 'company', risk: 1.0, x: 10, y: 10 },
    ] as Node[],
    links: [
      { source: 'proj_alpha', target: 'contractor_1', value: 4500000000, type: 'Direct Payment' },
      { source: 'contractor_1', target: 'subcon_x', value: 1200000000, type: 'Funneling' },
      { source: 'subcon_x', target: 'shell_entity', value: 800000000, type: 'Kickback' },
      { source: 'contractor_1', target: 'bank_offshore', value: 500000000, type: 'Diversion' },
      { source: 'bank_offshore', target: 'director_p', value: 300000000, type: 'Extraction' },
    ] as Link[]
  },
  
  sCurve: [
    { date: '2023-01-01', pv: 500000000, ac: 500000000 },
    { date: '2023-02-01', pv: 1200000000, ac: 1350000000 },
    { date: '2023-03-01', pv: 2800000000, ac: 3200000000 },
    { date: '2023-04-01', pv: 4500000000, ac: 6800000000 }, // Spike
    { date: '2023-05-01', pv: 7000000000, ac: 10500000000 },
    { date: '2023-06-01', pv: 10000000000, ac: 14200000000 },
  ],
  
  terminFlow: [
    { source: 'Uang Muka (20%)', target: 'Steel Procurement', value: 2500000000 },
    { source: 'Uang Muka (20%)', target: 'Mobilisation Fees', value: 1000000000 },
    { source: 'Termin 1 (Progress 35%)', target: 'Ready Mix Concrete', value: 4000000000 },
    { source: 'Termin 1 (Progress 35%)', target: 'Admin & Consultancy', value: 1500000000 },
    { source: 'Admin & Consultancy', target: 'CV. Internal Shell', value: 1200000000 }, // Leakage
    { source: 'Steel Procurement', target: 'PT. Steel Vendor A', value: 2300000000 },
  ],

  projectDashboard: {
    project: {
       name: "HOLOGRAPHIC SIMULATION: PROJECT OMEGA",
       code: "MOCK-SIM-772",
       status: "SIMULATED_AUDIT"
    },
    financials: {
      contract_value: 50000000000,
      total_released: 15000000000,
      total_spent_onsite: 9500000000
    },
    leakage: {
      total_leakage: 5500000000,
      markup_leakage: 3200000000
    },
    budget_variance: [
      { item_name: "Ready Mix Concrete (K-350)", category: "Material", unit_price_rab: 950000, avg_unit_price_actual: 1450000, markup_percentage: 52.6, volume_discrepancy: 120 },
      { item_name: "Reinforcing Steel (D-16)", category: "Material", unit_price_rab: 12500, avg_unit_price_actual: 13200, markup_percentage: 5.6, volume_discrepancy: 45000 },
      { item_name: "Excavator Rental", category: "Equipment", unit_price_rab: 450000, avg_unit_price_actual: 450000, markup_percentage: 0, volume_discrepancy: 200 }
    ]
  },
  
  geoMarkers: [
    { id: '1', description: 'Suspicious Cash Withdrawal (Branch 04)', amount: 500000000, lat: -3.7, lng: 128.18, status: 'suspicious' },
    { id: '2', description: 'PT. Sinar Konstruksi - Termin 1', amount: 4500000000, lat: -3.695, lng: 128.19, status: 'cleared' },
    { id: '3', description: 'Vendor Kickback Hotspot', amount: 1200000000, lat: -3.705, lng: 128.17, status: 'warning' },
    { id: '4', description: 'Director P. Residence Site', amount: 300000000, lat: -3.69, lng: 128.21, status: 'cleared' },
  ],

  reconciliationDemo: {
    internal: [
        { id: 'i1', category_code: 'MAT-001', description: 'Pembayaran Beton Cor Ready Mix', actual_amount: 1450000000 },
        { id: 'i2', category_code: 'EQP-044', description: 'Sewa Excavator PC-200 1 Month', actual_amount: 85000000 },
        { id: 'i3', category_code: 'LAB-098', description: 'Upah Tukang Minggu 4', actual_amount: 12400000 },
    ],
    bank: [
        { id: 'b1', bank_name: 'BCA Main', description: 'TRF WND PT SB CONCRETE', amount: 1450000000, timestamp: '2024-03-12 10:00:00' },
        { id: 'b2', bank_name: 'BCA Main', description: 'RENTAL HEAVY EQ AMBON', amount: 85000000, timestamp: '2024-03-14 14:30:00' },
        { id: 'b3', bank_name: 'BCA Main', description: 'WITHDRAWAL CASH MANDIRI', amount: 12400000, timestamp: '2024-03-15 09:12:00' },
    ],
    matches: [
        { internal_tx_id: 'i1', bank_tx_id: 'b1', confidence_score: 0.98, match_type: 'EXACT_AMOUNT' },
        { internal_tx_id: 'i2', bank_tx_id: 'b2', confidence_score: 0.94, match_type: 'FUZZY_DESC' },
        { internal_tx_id: 'i3', bank_tx_id: 'b3', confidence_score: 0.99, match_type: 'EXACT_AMOUNT' },
    ]
  },

  comparisonDemo: {
    summary: {
      total_transactions: 145,
      agreed: 132,
      disagreed: 13,
      app_found_more: 12,
      user_found_more: 1,
      agreement_rate: 0.91,
    },
    comparisons: [
      {
        row_no: 45,
        date: "2024-03-12",
        description: "TRF WND PT SINAR INDAH (KICKBACK LIKELY)",
        amount: 850000000,
        app_verdict: "suspicious",
        app_reasoning: ["Detected 3-hop path", "Overlapping Directorates"],
        user_marked_as_project: false,
        user_comment: "Routine supply payment",
        match_status: "disagree"
      },
      {
         row_no: 82,
         date: "2024-03-14",
         description: "CASH WITHDRAWAL AT BRANCH 04",
         amount: 50000000,
         app_verdict: "suspicious",
         app_reasoning: ["Round amount", "Outside business hours"],
         user_marked_as_project: false,
         user_comment: null,
         match_status: "disagree"
      }
    ],
    discovered_entities: { "PT. SINAR INDAH": 12, "CV. MAJU": 8 },
    discovered_patterns: { "CASH_WITHDRAWAL": 5, "ROUND_MILLIONS": 3 }
  }
};
