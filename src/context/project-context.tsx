"use client";

import React, { createContext, useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { Contract, ContractGroupKeys, ContractItem, Deduction, ProgressPayment, ProgressItem as ContextProgressItem, AllProjectData, contractGroups } from './types';


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
    addDraftTender: (group: ContractGroupKeys, name: string, subGroup: string) => void;
    addItemToContract: (contractId: string, item: ContractItem) => void;
    addDeduction: (deduction: Omit<Deduction, 'id' | 'appliedInPaymentNumber'>) => void;
    saveProgressPayment: (contractId: string, cumulativeSubTotal: number, progressItems: ContextProgressItem[], selectedDeductionIds: string[]) => void;
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
                totalAmount: 227500,
                items: [
                    { id: 'Y.16.050/01', cumulativeQuantity: 500 },
                    { id: '15.140.1001', cumulativeQuantity: 200 },
                    { id: '23.215.1105', cumulativeQuantity: 0 },
                    { id: '18.195.1101', cumulativeQuantity: 0 },
                ],
                appliedDeductionIds: []
            }
        ]
    }
};

const initialDeductionsData: Record<string, Deduction[]> = {
    "proje-istanbul": [
        { id: 'DED-001', contractId: 'SOZ-001', type: 'muhasebe', date: '2024-07-15', amount: 5000, description: 'Teminat Mektubu Komisyonu', appliedInPaymentNumber: null },
        { id: 'DED-002', contractId: 'SOZ-001', type: 'tutanakli', date: '2024-07-18', amount: 12500, description: 'Hatalı imalat tespiti', appliedInPaymentNumber: 1 },
        { id: 'DED-003', contractId: 'SOZ-002', type: 'muhasebe', date: '2024-07-25', amount: 2500, description: 'Damga Vergisi', appliedInPaymentNumber: null },
    ],
    "proje-ankara": []
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


export const ProjectProvider = ({ children }: { children: React.ReactNode }) => {
    const [projects, setProjects] = useState<Project[]>(() => getInitialState('projects', defaultProjects));
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => getInitialState('selectedProjectId', null));
    
    const [projectData, setProjectData] = useState<AllProjectData>(() => getInitialState('allProjectData', {
        contracts: initialContractsData,
        progressPayments: initialProgressHistory,
        deductions: initialDeductionsData,
        dashboard: projectDashboardData
    }));

    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
        if (!selectedProjectId && projects.length > 0) {
            setSelectedProjectId(projects[0].id);
        }
    }, [projects, selectedProjectId]);

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
            newData.dashboard[newId] = JSON.parse(JSON.stringify(emptyDashboardData)); // Deep copy
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

            const newApprovedContract: Contract = {
                ...tenderToApprove,
                id: newContractId,
                status: 'Onaylandı',
                date: new Date().toISOString().split('T')[0],
            };

            const updatedDrafts = currentProjectContracts.drafts.filter(t => t.id !== tenderId);
            const updatedApproved = [...currentProjectContracts.approved, newApprovedContract].sort((a, b) => a.id.localeCompare(b.id));

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

    const addDraftTender = useCallback((group: ContractGroupKeys, name: string, subGroup: string) => {
        if (!selectedProjectId) return;

        setProjectData(prevData => {
            const allDraftsCount = Object.values(prevData.contracts).flatMap(p => p.drafts).length;
            const newIdNumber = allDraftsCount + 8; // Keep original logic
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
            const currentProjectContracts = prevData.contracts[selectedProjectId];
            if (!currentProjectContracts) return prevData;

            const updatedDrafts = currentProjectContracts.drafts.map(draft => 
                draft.id === contractId ? { ...draft, items: [...draft.items, item] } : draft
            );

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

    const saveProgressPayment = useCallback((contractId: string, cumulativeSubTotal: number, progressItems: ContextProgressItem[], selectedDeductionIds: string[]) => {
        if (!selectedProjectId) return;

        setProjectData(prev => {
            const contractHistory = prev.progressPayments[selectedProjectId]?.[contractId] || [];
            const lastPayment = contractHistory.length > 0 ? contractHistory[contractHistory.length - 1] : null;
            const newPaymentNumber = (lastPayment?.progressPaymentNumber || 0) + 1;

            const newPayment: ProgressPayment = {
                progressPaymentNumber: newPaymentNumber,
                date: new Date().toISOString().split('T')[0],
                totalAmount: cumulativeSubTotal,
                items: progressItems.map(item => ({
                    id: item.id,
                    cumulativeQuantity: item.currentCumulativeQuantity,
                })),
                appliedDeductionIds: selectedDeductionIds,
            };

            const newContractHistory = [...contractHistory, newPayment];
            const newProjectHistory = { ...(prev.progressPayments[selectedProjectId] || {}), [contractId]: newContractHistory };
            
            const newProjectDeductions = (prev.deductions[selectedProjectId] || []).map(d => 
                selectedDeductionIds.includes(d.id) ? { ...d, appliedInPaymentNumber: newPaymentNumber } : d
            );

            return {
                ...prev,
                progressPayments: { ...prev.progressPayments, [selectedProjectId]: newProjectHistory },
                deductions: { ...prev.deductions, [selectedProjectId]: newProjectDeductions }
            };
        });
    }, [selectedProjectId]);

    const getDashboardData = useCallback(() => {
        if (!selectedProjectId || !projectData.dashboard[selectedProjectId]) {
            return emptyDashboardData;
        }
        return projectData.dashboard[selectedProjectId];
    }, [selectedProjectId, projectData]);
    
    const getContractsByProject = useCallback(() => {
        if (!selectedProjectId || !projectData.contracts[selectedProjectId]) {
            return [];
        }
        const { drafts, approved } = projectData.contracts[selectedProjectId];
        return [...drafts, ...approved];
    }, [selectedProjectId, projectData]);


    const selectedProject = useMemo(() => {
        if (!isLoaded) return null;
        const project = projects.find(p => p.id === selectedProjectId) || projects[0] || null;
        if (project?.id !== selectedProjectId) {
            setSelectedProjectId(project?.id || null);
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
        addDraftTender,
        addItemToContract,
        addDeduction,
        saveProgressPayment,
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
