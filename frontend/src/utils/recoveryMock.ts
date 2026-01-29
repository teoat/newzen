export const ASSET_RECOVERY_MOCK = {
    recovery_pot: 125000000000, // 125B IDR
    frozen_value: 45000000000,   // 45B IDR
    readiness: 36,
    assets: [
        {
            id: 'AST-001',
            name: 'Menteng Residence Pool-House',
            type: 'Real Estate',
            value: 65000000000,
            owner: 'Suspect A (UBO)',
            status: 'FROZEN',
            location: 'Menteng, Jakarta Pusat',
            discovery_path: 'Circular Flow -> Contractor B -> Shell Co Z -> Prop Holding'
        },
        {
            id: 'AST-002',
            name: 'Mercedes-Benz G63 AMG',
            type: 'Vehicle',
            value: 5800000000,
            owner: 'Wife of Suspect A',
            status: 'ACTIVE',
            location: 'BSD City',
            discovery_path: 'XP Leakage -> Luxury Dealership X'
        },
        {
            id: 'AST-003',
            name: 'Patek Philippe Nautilus 5711',
            type: 'Luxury Good',
            value: 2200000000,
            owner: 'Director of PT. Shell Utama',
            status: 'FROZEN',
            location: 'Locked Cabinet 02',
            discovery_path: 'Invoice Markup -> Cash Withdrawal -> Watch Purchase'
        },
        {
            id: 'AST-004',
            name: 'Industrial Warehouse Complex',
            type: 'Real Estate',
            value: 52000000000,
            owner: 'PT. Logistik Maju (Straw Man)',
            status: 'ACTIVE',
            location: 'Cikarang, West Java',
            discovery_path: 'Project Funds -> Vendor Y -> Land Purchase'
        }
    ],
    ubo_nodes: [
        { id: '1', name: 'Aldi (Project Director)', type: 'PERSON', role: 'UBO', level: 0 },
        { id: '2', name: 'PT. Global Konstruksi', type: 'COMPANY', role: 'Flagged Entity', level: 1 },
        { id: '3', name: 'PT. Cipta Properti', type: 'COMPANY', role: 'Shell Layer 1', level: 2 },
        { id: '4', name: 'PT. Harta Abadi', type: 'COMPANY', role: 'Shell Layer 2', level: 3 },
    ],
    ubo_links: [
        { source: '1', target: '4', type: 'Beneficial Owner', stake: 100 },
        { source: '4', target: '3', type: 'Shareholder', stake: 95 },
        { source: '3', target: '2', type: 'Shareholder', stake: 80 },
    ]
};
