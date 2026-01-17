


export const contractGroups = {
  "proje": "Proje",
  "reklam": "Reklam",
  "idari-isler": "İdari İşler",
  "tedarikler": "Tedarikler",
  "kaba-isler": "Kaba İşler",
  "ince-isler": "İnce İşler",
  "elektrik": "Elektrik İşleri",
  "mekanik": "Mekanik İşleri",
  "yalitim": "Yalıtım İşleri",
  "peyzaj": "Peyzaj İşleri",
  "sosyal-tesisler": "Sosyal Tesisler"
};

export type ContractGroupKeys = keyof typeof contractGroups;

export interface FirestoreDocument {
    id: string;
}

export interface Project extends FirestoreDocument {
    name: string;
}

export interface ContractItem {
    poz: string;
    description: string;
    unit: string;
    quantity: number;
    unitPrice: number;
}

export interface Contract extends FirestoreDocument {
    name: string;
    group: ContractGroupKeys;
    subGroup: string;
    status: string; // 'Hazırlık', 'Teklif Alındı', 'Onaylandı' etc.
    date: string;
    items: ContractItem[];
    isDraft: boolean;
}

export interface ProgressItem {
  id: string;
  description: string;
  unit: string;
  unitPrice: number;
  contractQuantity: number;
  previousCumulativeQuantity: number;
  currentCumulativeQuantity: number;
  currentCumulativePercentage: string;
}

export interface ExtraWorkItem {
    id: string;
    description: string;
    unit: string;
    quantity: number;
    unitPrice: number;
}

export interface ProgressPayment extends FirestoreDocument {
    progressPaymentNumber: number;
    date: string;
    totalAmount: number; // Cumulative total
    items: {
        id: string;
        cumulativeQuantity: number;
    }[];
    extraWorkItems?: ExtraWorkItem[];
    appliedDeductionIds: string[];
}

export interface Deduction extends FirestoreDocument {
    contractId: string;
    type: 'muhasebe' | 'tutanakli';
    date: string; 
    amount: number;
    description: string;
    appliedInPaymentNumber: number | null; 
}

export type ProgressPaymentStatus = 'yok' | 'sahada' | 'imzada' | 'onayda' | 'pas_gec';

export interface AllProjectData {
    contracts: Record<string, { drafts: Contract[], approved: Contract[] }>;
    progressPayments: Record<string, Record<string, ProgressPayment[]>>;
    deductions: Record<string, Deduction[]>;
    progressStatuses: Record<string, Record<string, Record<string, ProgressPaymentStatus>>>;
    dashboard: Record<string, any>;
}
