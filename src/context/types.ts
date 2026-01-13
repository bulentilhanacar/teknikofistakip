
export const contractGroups = {
  "reklam": "Reklam ve Tanıtım",
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

export interface ContractItem {
    poz: string;
    description: string;
    unit: string;
    quantity: number;
    unitPrice: number;
}

export interface Contract {
    id: string;
    name: string;
    group: ContractGroupKeys;
    subGroup: string;
    status: string;
    date: string;
    items: ContractItem[];
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

export interface ProgressPayment {
    progressPaymentNumber: number;
    date: string;
    totalAmount: number;
    items: {
        id: string;
        cumulativeQuantity: number;
    }[];
    appliedDeductionIds: string[];
}

export interface Deduction {
    id: string;
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
    progressStatuses: Record<string, Record<string, ProgressPaymentStatus>>;
    dashboard: Record<string, any>;
}
