"use client";

import React, { createContext, useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { Contract, ContractGroupKeys, ContractItem, Deduction, ProgressPayment, ProgressItem as ContextProgressItem, AllProjectData, ProgressPaymentStatus, ExtraWorkItem } from './types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';


// Proje ve veri tiplerini tanımlıyoruz
interface Project {
    id: string;
    name: string;
}

interface ProjectContextType {
    projects: Project[];
    selectedProject: Project | null;
    projectData: AllProjectData;
    selectProject: (projectId: string | null) => void;
    addProject: (projectName: string) => void;
    updateProjectName: (projectId: string, newName: string) => void;
    deleteProject: (projectId: string) => void;
    approveTender: (tenderId: string) => void;
    revertContractToDraft: (contractId: string) => void;
    addDraftTender: (group: ContractGroupKeys, name: string, subGroup: string) => void;
    addItemToContract: (contractId: string, item: ContractItem) => void;
    updateContractItem: (contractId: string, updatedItem: ContractItem, originalPoz: string) => void;
    deleteContractItem: (contractId: string, itemPoz: string) => void;
    addDeduction: (deduction: Omit<Deduction, 'id' | 'appliedInPaymentNumber'>) => void;
    saveProgressPayment: (contractId: string, paymentData: Omit<ProgressPayment, 'progressPaymentNumber'>, editingPaymentNumber: number | null) => void;
    deleteProgressPaymentsForContract: (contractId: string) => void;
    updateProgressPaymentStatus: (month: string, contractId: string, status: ProgressPaymentStatus) => void;
    getDashboardData: () => any;
    getContractsByProject: () => Contract[];
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// LocalStorage'dan verileri okumak ve yazmak için yardımcı fonksiyonlar
const getInitialState = <T,>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') {
        return defaultValue;
    }
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key “${key}”:`, error);
        return defaultValue;
    }
};

const defaultProjects: Project[] = [
    { id: "proje-istanbul", name: "İstanbul Ofis Projesi" },
    { id: "proje-ankara", name: "Ankara Konut Projesi" },
];

const initialContractsData: Record<string, {drafts: Contract[], approved: Contract[]}> = {
    "proje-istanbul": {
        drafts: [
            { id: 'IHALE-005', name: 'Tanıtım Filmi Çekimi', group: 'reklam', subGroup: 'Dijital Medya', status: 'Teklif Alındı', date: '2024-09-20', items: [
                { poz: 'RF-01', description: 'Prodüksiyon', unit: 'gün', quantity: 5, unitPrice: 15000 },
                { poz: 'RF-02', description: 'Post-Prodüksiyon', unit: 'gün', quantity: 10, unitPrice: 7500 },
            ]},
            { id: 'IHALE-006', name: 'Genel Vitrifiye Malzemeleri', group: 'tedarikler', subGroup: 'Sıhhi Tesisat Malzemeleri', status: 'Hazırlık', date: '2024-10-05', items: [
                { poz: 'VIT-01', description: 'Klozet Takımı', unit: 'adet', quantity: 120, unitPrice: 4500 },
                { poz: 'VIT-02', description: 'Lavabo ve Batarya', unit: 'adet', quantity: 150, unitPrice: 3500 },
            ]},
        ],
        approved: [
            { id: 'SOZ-001', name: 'İstanbul Ofis Binası - Betonarme', group: 'kaba-isler', subGroup: 'Betonarme ve Çelik', status: 'Onaylandı', date: '2024-08-10', items: [
              { poz: '15.150.1005', description: 'Makine ile Kazı', unit: 'm³', quantity: 8000, unitPrice: 175 },
              { poz: 'C30', description: 'C30 Beton', unit: 'm³', quantity: 2500, unitPrice: 3200 },
            ]},
            { id: 'SOZ-002', name: 'Eskişehir Villa Projesi - Lamine Parke', group: 'ince-isler', subGroup: 'Zemin Kaplamaları', status: 'Onaylandı', date: '2024-06-15', items: [
               { poz: '25.115.1402', description: 'Lamine Parke', unit: 'm²', quantity: 450, unitPrice: 1800 },
            ]},
        ]
    },
    "proje-ankara": {
        drafts: [
            { id: 'IHALE-001', name: 'Ankara Konut Projesi - Hafriyat', group: 'kaba-isler', subGroup: 'Hafriyat İşleri', status: 'Değerlendirmede', date: '2024-09-15', items: [
              { poz: '15.150.1005', description: 'Makine ile Kazı', unit: 'm³', quantity: 5000, unitPrice: 180 },
              { poz: '15.160.1002', description: 'Dolgu Serme ve Sıkıştırma', unit: 'm³', quantity: 2500, unitPrice: 240 },
            ]},
            { id: 'IHALE-003', name: 'İzmir AVM İnşaatı - Çelik Konstrüksiyon', group: 'kaba-isler', subGroup: 'Betonarme ve Çelik', status: 'Hazırlık', date: '2024-10-01', items: [
               { poz: '23.014', description: 'Çelik Kolon Montajı', unit: 'ton', quantity: 150, unitPrice: 45000 },
               { poz: '23.015', description: 'Çelik Kiriş Montajı', unit: 'ton', quantity: 200, unitPrice: 42000 },
            ]},
            { id: 'IHALE-007', name: 'Alçıpan ve Boya İşleri', group: 'ince-isler', subGroup: 'Boya ve Kaplama', status: 'Değerlendirmede', date: '2024-09-25', items: [] },
        ],
        approved: []
    }
};

const initialProgressHistory: Record<string, Record<string, ProgressPayment[]>> = {
    "proje-istanbul": {
        "SOZ-001": [
            {
                progressPaymentNumber: 1,
                date: "2024-07-20",
                totalAmount: 1400000,
                items: [
                    { id: '15.150.1005', cumulativeQuantity: 8000 },
                    { id: 'C30', cumulativeQuantity: 0 },
                ],
                extraWorkItems: [],
                appliedDeductionIds: ['DED-002']
            },
             {
                progressPaymentNumber: 2,
                date: "2024-08-20",
                totalAmount: 9400000,
                items: [
                    { id: '15.150.1005', cumulativeQuantity: 8000 },
                    { id: 'C30', cumulativeQuantity: 2500 },
                ],
                extraWorkItems: [],
                appliedDeductionIds: ['DED-001']
            }
        ]
    }
};

const initialDeductionsData: Record<string, Deduction[]> = {
    "proje-istanbul": [
        { id: 'DED-001', contractId: 'SOZ-001', type: 'muhasebe', date: '2024-07-15', amount: 5000, description: 'Teminat Mektubu Komisyonu', appliedInPaymentNumber: 2 },
        { id: 'DED-002', contractId: 'SOZ-001', type: 'tutanakli', date: '2024-07-18', amount: 12500, description: 'Hatalı imalat tespiti', appliedInPaymentNumber: 1 },
        { id: 'DED-003', contractId: 'SOZ-002', type: 'muhasebe', date: '2024-07-25', amount: 2500, description: 'Damga Vergisi', appliedInPaymentNumber: null },
    ],
    "proje-ankara": []
};

const initialProgressStatuses: Record<string, Record<string, Record<string, ProgressPaymentStatus>>> = {
    "proje-istanbul": {
        "2024-08": {
            "SOZ-001": "sahada",
            "SOZ-002": "pas_gec"
        },
        "2024-09": {
            "SOZ-001": "yok",
            "SOZ-002": "yok"
        }
    },
    "proje-ankara": {}
};

const projectDashboardData: Record<string, any> = {
  "proje-istanbul": {
    stats: { totalProgressPayment: 1324000, activeContracts: 12, pendingTenders: 5, upcomingPayments: 3, upcomingPaymentsTotal: 175000 },
    chartData: [
      { month: "Ocak", income: 186000, expense: 80000 }, { month: "Şubat", income: 305000, expense: 200000 }, { month: "Mart", income: 237000, expense: 120000 }, { month: "Nisan", income: 173000, expense: 190000 }, { month: "Mayıs", income: 209000, expense: 130000 }, { month: "Haziran", income: 214000, expense: 140000 },
    ],
    reminders: [
      { id: 1, title: "Proje A İhale Tarihi", date: "2024-08-15", type: "İhale" }, { id: 2, title: "Sözleşme B İmza", date: "2024-08-20", type: "Sözleşme" }, { id: 3, title: "Proje C Hakediş Ödemesi", date: "2024-09-01", type: "Hakediş" },
    ],
  },
  "proje-ankara": {
    stats: { totalProgressPayment: 850000, activeContracts: 8, pendingTenders: 2, upcomingPayments: 1, upcomingPaymentsTotal: 95000 },
    chartData: [
      { month: "Ocak", income: 120000, expense: 50000 }, { month: "Şubat", income: 210000, expense: 150000 }, { month: "Mart", income: 180000, expense: 90000 }, { month: "Nisan", income: 150000, expense: 110000 }, { month: "Mayıs", income: 110000, expense: 80000 }, { month: "Haziran", income: 190000, expense: 120000 },
    ],
    reminders: [
      { id: 1, title: "Ankara Hafriyat İhalesi", date: "2024-09-10", type: "İhale" }, { id: 2, title: "Ankara Zemin Etüdü Ödemesi", date: "2024-09-15", type: "Hakediş" },
    ],
  }
};
const emptyDashboardData = { stats: { totalProgressPayment: 0, activeContracts: 0, pendingTenders: 0, upcomingPayments: 0, upcomingPaymentsTotal: 0 }, chartData: [], reminders: [] };

const cleanDuplicateProgressPayments = (data: AllProjectData): AllProjectData => {
    const cleanedData = JSON.parse(JSON.stringify(data)); 
    for (const projectId in cleanedData.progressPayments) {
        for (const contractId in cleanedData.progressPayments[projectId]) {
            const history = cleanedData.progressPayments[projectId][contractId] as ProgressPayment[];
            if (Array.isArray(history)) {
                const uniquePayments: Record<number, ProgressPayment> = {};
                for (const payment of history) {
                    uniquePayments[payment.progressPaymentNumber] = payment;
                }
                cleanedData.progressPayments[projectId][contractId] = Object.values(uniquePayments).sort((a,b) => a.progressPaymentNumber - b.progressPaymentNumber);
            }
        }
    }
    return cleanedData;
};


export const ProjectProvider = ({ children }: { children: React.ReactNode }) => {
    const { toast } = useToast();
    const [projects, setProjects] = useState<Project[]>(() => getInitialState('projects', defaultProjects));
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => getInitialState('selectedProjectId', null));
    
    const [projectData, setProjectData] = useState<AllProjectData>(() => {
        const storedData = getInitialState<AllProjectData | null>('allProjectData', null);
        const defaultData = {
            contracts: initialContractsData,
            progressPayments: initialProgressHistory,
            deductions: initialDeductionsData,
            dashboard: projectDashboardData,
            progressStatuses: initialProgressStatuses,
        };
        const merged = { 
            ...defaultData, 
            ...storedData,
            progressStatuses: { ...defaultData.progressStatuses, ...(storedData?.progressStatuses || {}) }
        };
         Object.keys(merged.contracts).forEach(projectId => {
            if (!merged.progressStatuses[projectId]) {
                merged.progressStatuses[projectId] = {};
            }
        });
        return cleanDuplicateProgressPayments(merged);
    });

    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
        if (!selectedProjectId && projects.length > 0) {
            const initialId = getInitialState('selectedProjectId', projects[0].id);
            setSelectedProjectId(initialId);
        }
    }, []);

    useEffect(() => {
        if(isLoaded) {
            localStorage.setItem('projects', JSON.stringify(projects));
            localStorage.setItem('selectedProjectId', JSON.stringify(selectedProjectId));
            localStorage.setItem('allProjectData', JSON.stringify(projectData));
        }
    }, [projects, selectedProjectId, projectData, isLoaded]);

    const selectProject = (projectId: string | null) => {
        setSelectedProjectId(projectId);
    };

    const addProject = (projectName: string) => {
        const newProject = {
            id: `proje-${projectName.toLowerCase().replace(/\s/g, '-')}-${Date.now()}`,
            name: projectName,
        };
        setProjects(prev => [...prev, newProject]);
        
        setProjectData(prev => {
            const newId = newProject.id;
            const newData = { ...prev };
            newData.contracts[newId] = { drafts: [], approved: [] };
            newData.progressPayments[newId] = {};
            newData.deductions[newId] = [];
            newData.dashboard[newId] = JSON.parse(JSON.stringify(emptyDashboardData));
            newData.progressStatuses[newId] = {};
            return newData;
        });

        setSelectedProjectId(newProject.id);
    };
    
    const updateProjectName = (projectId: string, newName: string) => {
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, name: newName } : p));
    };

    const deleteProject = (projectId: string) => {
        setProjects(prev => {
            const newProjects = prev.filter(p => p.id !== projectId);
            if (selectedProjectId === projectId) {
                setSelectedProjectId(newProjects[0]?.id || null);
            }
            return newProjects;
        });
        
        setProjectData(prev => {
            const newData = { ...prev };
            delete newData.contracts[projectId];
            delete newData.progressPayments[projectId];
            delete newData.deductions[projectId];
            delete newData.dashboard[projectId];
            delete newData.progressStatuses[projectId];
            return newData;
        });
    };

    const approveTender = useCallback((tenderId: string) => {
        if (!selectedProjectId) return;

        setProjectData(prevData => {
            const currentProjectContracts = prevData.contracts[selectedProjectId] || { drafts: [], approved: [] };
            const tenderToApprove = currentProjectContracts.drafts.find(t => t.id === tenderId);
            
            if (!tenderToApprove) return prevData;
            
            const allApprovedCount = Object.values(prevData.contracts).flatMap(p => p.approved).length;
            const newIdNumber = allApprovedCount + 1;
            const newContractId = `SOZ-${String(newIdNumber).padStart(3, '0')}`;

            const newContract: Contract = {
                ...tenderToApprove,
                id: newContractId,
                status: 'Onaylandı',
                date: new Date().toISOString().split('T')[0],
            };

            const updatedDrafts = currentProjectContracts.drafts.filter(t => t.id !== tenderId);
            const updatedApproved = [...currentProjectContracts.approved, newContract].sort((a, b) => a.id.localeCompare(b.id));

            return {
                ...prevData,
                contracts: {
                    ...prevData.contracts,
                    [selectedProjectId]: {
                        drafts: updatedDrafts,
                        approved: updatedApproved
                    }
                }
            };
        });
    }, [selectedProjectId]);

    const revertContractToDraft = useCallback((contractId: string) => {
        if (!selectedProjectId) return;

        const progressPayments = projectData.progressPayments[selectedProjectId]?.[contractId];
        if (progressPayments && progressPayments.length > 0) {
            toast({
                variant: "destructive",
                title: "İşlem Başarısız",
                description: "Bu sözleşmenin yapılmış hakedişleri var. Geri almak için önce hakedişleri silmelisiniz.",
            });
            return;
        }

        setProjectData(prevData => {
            const currentProjectContracts = prevData.contracts[selectedProjectId!] || { drafts: [], approved: [] };
            const contractToRevert = currentProjectContracts.approved.find(c => c.id === contractId);

            if (!contractToRevert) return prevData;
            
            const allDraftsCount = Object.values(prevData.contracts).flatMap(p => p.drafts).length;
            const newTenderId = `IHALE-${String(allDraftsCount + 10).padStart(3, '0')}`;

            const newDraft: Contract = {
                ...contractToRevert,
                id: newTenderId,
                status: 'Hazırlık',
            };

            const updatedApproved = currentProjectContracts.approved.filter(c => c.id !== contractId);
            const updatedDrafts = [...currentProjectContracts.drafts, newDraft].sort((a, b) => a.id.localeCompare(b.id));
            
            toast({
                title: "İşlem Başarılı",
                description: `${contractId} numaralı sözleşme taslaklara taşındı. Yeni ID: ${newTenderId}`,
            });

            return {
                ...prevData,
                contracts: {
                    ...prevData.contracts,
                    [selectedProjectId!]: {
                        drafts: updatedDrafts,
                        approved: updatedApproved
                    }
                }
            };
        });
    }, [selectedProjectId, projectData.progressPayments, toast]);

    const addDraftTender = useCallback((group: ContractGroupKeys, name: string, subGroup: string) => {
        if (!selectedProjectId) return;

        setProjectData(prevData => {
            const allDraftsCount = Object.values(prevData.contracts).flatMap(p => p.drafts).length;
            const newIdNumber = allDraftsCount + 10;
            const newTenderId = `IHALE-${String(newIdNumber).padStart(3, '0')}`;

            const newDraft: Contract = {
                id: newTenderId, name, group, subGroup, status: 'Hazırlık',
                date: new Date().toISOString().split('T')[0], items: []
            };

            const currentProjectContracts = prevData.contracts[selectedProjectId] || { drafts: [], approved: [] };
            const updatedDrafts = [...currentProjectContracts.drafts, newDraft].sort((a, b) => a.id.localeCompare(b.id));

            return {
                ...prevData,
                contracts: {
                    ...prevData.contracts,
                    [selectedProjectId]: {
                        ...currentProjectContracts,
                        drafts: updatedDrafts
                    }
                }
            };
        });
    }, [selectedProjectId]);

    const addItemToContract = useCallback((contractId: string, item: ContractItem) => {
         if (!selectedProjectId) return;

        setProjectData(prevData => {
            const projectContracts = prevData.contracts[selectedProjectId];
            if (!projectContracts) return prevData;
            
            const updatedContracts = { ...projectContracts };

            const draftIndex = updatedContracts.drafts.findIndex(d => d.id === contractId);
            if(draftIndex > -1) {
                 const newDraft = { ...updatedContracts.drafts[draftIndex] };
                 newDraft.items = [...newDraft.items, item];
                 updatedContracts.drafts[draftIndex] = newDraft;
            }

            return {
                ...prevData,
                contracts: {
                    ...prevData.contracts,
                    [selectedProjectId]: updatedContracts
                }
            };
        });
    }, [selectedProjectId]);
    
    const updateContractItem = useCallback((contractId: string, updatedItem: ContractItem, originalPoz: string) => {
        if (!selectedProjectId) return;

        setProjectData(prevData => {
            const projectContracts = prevData.contracts[selectedProjectId];
            if (!projectContracts) return prevData;

            const updateItems = (contracts: Contract[]) => 
                contracts.map(c => {
                    if (c.id === contractId) {
                        const newItems = c.items.map(item => item.poz === originalPoz ? updatedItem : item);
                        return { ...c, items: newItems };
                    }
                    return c;
                });
            
            return {
                ...prevData,
                contracts: {
                    ...prevData.contracts,
                    [selectedProjectId]: {
                        drafts: updateItems(projectContracts.drafts),
                        approved: updateItems(projectContracts.approved),
                    }
                }
            };
        });
    }, [selectedProjectId]);

    const deleteContractItem = useCallback((contractId: string, itemPoz: string) => {
        if (!selectedProjectId) return;

        setProjectData(prevData => {
            const projectContracts = prevData.contracts[selectedProjectId];
            if (!projectContracts) return prevData;

            const updateItems = (contracts: Contract[]) =>
                contracts.map(c => {
                    if (c.id === contractId) {
                        const newItems = c.items.filter(item => item.poz !== itemPoz);
                        return { ...c, items: newItems };
                    }
                    return c;
                });

            return {
                ...prevData,
                contracts: {
                    ...prevData.contracts,
                    [selectedProjectId]: {
                        drafts: updateItems(projectContracts.drafts),
                        approved: updateItems(projectContracts.approved),
                    }
                }
            };
        });
    }, [selectedProjectId]);


    const addDeduction = useCallback((deduction: Omit<Deduction, 'id' | 'appliedInPaymentNumber'>) => {
        if (!selectedProjectId) return;
        
        setProjectData(prev => {
            const newId = `DED-${String(Date.now()).slice(-5)}`;
            const newEntry: Deduction = {
                ...deduction,
                id: newId,
                appliedInPaymentNumber: null
            };
            const updatedProjectDeductions = [...(prev.deductions[selectedProjectId] || []), newEntry];
            return {
                ...prev,
                deductions: {
                    ...prev.deductions,
                    [selectedProjectId]: updatedProjectDeductions
                }
            };
        });
    }, [selectedProjectId]);

   const saveProgressPayment = useCallback((contractId: string, paymentData: Omit<ProgressPayment, 'progressPaymentNumber'>, editingPaymentNumber: number | null) => {
        if (!selectedProjectId) return;

        setProjectData(prev => {
            const clonedData = JSON.parse(JSON.stringify(prev));
            let contractHistory: ProgressPayment[] = clonedData.progressPayments[selectedProjectId]?.[contractId] || [];

            if (editingPaymentNumber !== null) {
                // Editing existing payment
                contractHistory = contractHistory.map(p => 
                    p.progressPaymentNumber === editingPaymentNumber 
                    ? { ...paymentData, progressPaymentNumber: editingPaymentNumber } 
                    : p
                );
            } else {
                // Creating new payment
                const lastPaymentNumber = contractHistory.length > 0 
                    ? Math.max(...contractHistory.map(p => p.progressPaymentNumber)) 
                    : 0;
                const newPaymentNumber = lastPaymentNumber + 1;
                const newPayment: ProgressPayment = {
                    ...paymentData,
                    progressPaymentNumber: newPaymentNumber,
                };
                contractHistory = [...contractHistory, newPayment];
            }
            
            const currentPaymentNumber = editingPaymentNumber ?? contractHistory.at(-1)!.progressPaymentNumber;

            const newProjectDeductions = (clonedData.deductions[selectedProjectId] || []).map((d: Deduction) => {
                if (paymentData.appliedDeductionIds.includes(d.id)) {
                    return { ...d, appliedInPaymentNumber: currentPaymentNumber };
                } else if (d.appliedInPaymentNumber === currentPaymentNumber) {
                    return { ...d, appliedInPaymentNumber: null };
                }
                return d;
            });
            clonedData.deductions[selectedProjectId] = newProjectDeductions;
            
            const currentMonth = format(new Date(paymentData.date), 'yyyy-MM');
            const projectStatuses = clonedData.progressStatuses[selectedProjectId] || {};
            const monthStatuses = projectStatuses[currentMonth] || {};
            const newProgressStatuses = { 
                ...projectStatuses,
                [currentMonth]: {
                    ...monthStatuses,
                    [contractId]: 'odendi' as ProgressPaymentStatus
                }
             };
            clonedData.progressStatuses[selectedProjectId] = newProgressStatuses;


            const projectPayments = clonedData.progressPayments[selectedProjectId] || {};
            projectPayments[contractId] = contractHistory;
            clonedData.progressPayments[selectedProjectId] = projectPayments;

            return clonedData;
        });
    }, [selectedProjectId]);
    
    const deleteProgressPaymentsForContract = useCallback((contractId: string) => {
        if (!selectedProjectId) return;

        setProjectData(prev => {
            const clonedData = JSON.parse(JSON.stringify(prev));
            
            // Delete progress payments for the contract
            if (clonedData.progressPayments[selectedProjectId]) {
                delete clonedData.progressPayments[selectedProjectId][contractId];
            }

            // Reset appliedInPaymentNumber for related deductions
            const projectDeductions = (clonedData.deductions[selectedProjectId] || []).map((deduction: Deduction) => {
                if (deduction.contractId === contractId && deduction.appliedInPaymentNumber !== null) {
                    return { ...deduction, appliedInPaymentNumber: null };
                }
                return deduction;
            });
            clonedData.deductions[selectedProjectId] = projectDeductions;
            
             toast({
                title: "Hakediş Geçmişi Silindi",
                description: `${contractId} sözleşmesine ait tüm hakedişler ve ilgili kesinti bağlantıları kaldırıldı.`,
            });

            return clonedData;
        });

    }, [selectedProjectId, toast]);

    
    const updateProgressPaymentStatus = useCallback((month: string, contractId: string, status: ProgressPaymentStatus) => {
        if (!selectedProjectId) return;
        
        setProjectData(prev => {
            const projectStatuses = prev.progressStatuses[selectedProjectId] || {};
            const monthStatuses = projectStatuses[month] || {};
            const updatedMonthStatuses = { ...monthStatuses, [contractId]: status };
            const updatedProjectStatuses = { ...projectStatuses, [month]: updatedMonthStatuses };

            return {
                ...prev,
                progressStatuses: {
                    ...prev.progressStatuses,
                    [selectedProjectId]: updatedProjectStatuses,
                }
            }
        });

    }, [selectedProjectId]);


    const getDashboardData = useCallback(() => {
        if (!selectedProjectId || !projectData.dashboard[selectedProjectId]) {
            return emptyDashboardData;
        }
        return projectData.dashboard[selectedProjectId];
    }, [selectedProjectId, projectData.dashboard]);
    
    const getContractsByProject = useCallback(() => {
        if (!selectedProjectId || !projectData.contracts[selectedProjectId]) {
            return [];
        }
        const { drafts, approved } = projectData.contracts[selectedProjectId];
        return [...drafts, ...approved];
    }, [selectedProjectId, projectData.contracts]);


    const selectedProject = useMemo(() => {
        if (!isLoaded) return null;
        const project = projects.find(p => p.id === selectedProjectId) || projects[0] || null;
        if (project && project.id !== selectedProjectId) {
        }
        return project;
    }, [selectedProjectId, projects, isLoaded]);

    const value: ProjectContextType = {
        projects,
        selectedProject,
        projectData,
        selectProject,
        addProject,
        updateProjectName,
        deleteProject,
        approveTender,
        revertContractToDraft,
        addDraftTender,
        addItemToContract,
        updateContractItem,
        deleteContractItem,
        addDeduction,
        saveProgressPayment,
        deleteProgressPaymentsForContract,
        updateProgressPaymentStatus,
        getDashboardData,
        getContractsByProject
    };

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = (): ProjectContextType => {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};

    