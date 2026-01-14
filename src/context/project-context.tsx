"use client";

import React, { createContext, useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { Contract, ContractGroupKeys, ContractItem, Deduction, ProgressPayment, ExtraWorkItem, ProgressPaymentStatus, Project } from './types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useCollection, useDoc, useFirestore } from '@/firebase';
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore';

interface ProjectContextType {
    projects: Project[] | null;
    selectedProject: Project | null;
    selectProject: (projectId: string | null) => void;
    addProject: (projectName: string) => void;
    updateProjectName: (projectId: string, newName: string) => void;
    deleteProject: (projectId: string) => void;
    // approveTender: (tenderId: string) => void;
    // revertContractToDraft: (contractId: string) => void;
    // addDraftTender: (group: ContractGroupKeys, name: string, subGroup: string) => void;
    // addItemToContract: (contractId: string, item: ContractItem) => void;
    // updateContractItem: (contractId: string, updatedItem: ContractItem, originalPoz: string) => void;
    // deleteContractItem: (contractId: string, itemPoz: string) => void;
    updateDraftContractName: (contractId: string, newName: string) => void;
    deleteDraftContract: (contractId: string) => void;
    // addDeduction: (deduction: Omit<Deduction, 'id' | 'appliedInPaymentNumber'>) => void;
    // deleteDeduction: (deductionId: string) => void;
    // saveProgressPayment: (contractId: string, paymentData: Omit<ProgressPayment, 'progressPaymentNumber'>, editingPaymentNumber: number | null) => void;
    // deleteProgressPaymentsForContract: (contractId: string) => void;
    // updateProgressPaymentStatus: (month: string, contractId: string, status: ProgressPaymentStatus) => void;
    // getDashboardData: () => any;
    // getContractsByProject: () => Contract[];
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

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


export const ProjectProvider = ({ children }: { children: React.ReactNode }) => {
    const { toast } = useToast();
    // const { user } = useAuth();
    const firestore = useFirestore();

    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => getInitialState('selectedProjectId', null));

    const projectsQuery = useMemo(() => {
        if (!firestore) return null;
        // Temporarily remove user dependency
        // return query(collection(firestore, "projects"), where("ownerId", "==", user.uid));
        return query(collection(firestore, "projects"));
    }, [firestore]);

    const { data: projects, loading: projectsLoading } = useCollection<Project>(projectsQuery);

    useEffect(() => {
        if (!projectsLoading && projects && projects.length > 0) {
            // Check if selected project is still valid
            if (selectedProjectId && !projects.some(p => p.id === selectedProjectId)) {
                setSelectedProjectId(projects[0].id);
            } else if (!selectedProjectId) {
                setSelectedProjectId(projects[0].id);
            }
        }
         if (!projectsLoading && projects && projects.length === 0) {
            setSelectedProjectId(null);
        }
    }, [projects, projectsLoading, selectedProjectId]);


    useEffect(() => {
        if (selectedProjectId) {
            localStorage.setItem('selectedProjectId', JSON.stringify(selectedProjectId));
        } else {
             localStorage.removeItem('selectedProjectId');
        }
    }, [selectedProjectId]);

    const selectProject = (projectId: string | null) => {
        setSelectedProjectId(projectId);
    };

    const addProject = useCallback(async (projectName: string) => {
        if (!firestore) return; //  || !user
        try {
            const newProjectRef = await addDoc(collection(firestore, "projects"), {
                name: projectName,
                ownerId: "temp_owner", // user.uid,
            });
            setSelectedProjectId(newProjectRef.id);
            toast({ title: "Proje oluşturuldu!" });
        } catch (error) {
            console.error("Error adding project:", error);
            toast({ title: "Hata", description: "Proje oluşturulamadı.", variant: "destructive" });
        }
    }, [firestore, toast]); // user,
    
    const updateProjectName = useCallback(async (projectId: string, newName: string) => {
        if (!firestore) return;
        try {
            const projectRef = doc(firestore, "projects", projectId);
            await updateDoc(projectRef, { name: newName });
            toast({ title: "Proje güncellendi." });
        } catch (error) {
            console.error("Error updating project:", error);
            toast({ title: "Hata", description: "Proje güncellenemedi.", variant: "destructive" });
        }
    }, [firestore, toast]);

    const deleteProject = useCallback(async (projectId: string) => {
        if (!firestore) return;
        try {
            // This is a simplified delete. In a real app, you'd want to delete all subcollections too.
            // This would require a Cloud Function for full cleanup.
            await deleteDoc(doc(firestore, "projects", projectId));
             if (selectedProjectId === projectId) {
                const remainingProjects = projects?.filter(p => p.id !== projectId);
                setSelectedProjectId(remainingProjects && remainingProjects.length > 0 ? remainingProjects[0].id : null);
            }
            toast({ title: "Proje silindi." });
        } catch (error) {
             console.error("Error deleting project:", error);
            toast({ title: "Hata", description: "Proje silinemedi.", variant: "destructive" });
        }
    }, [firestore, toast, selectedProjectId, projects]);
    
    // Stubs for functions to be implemented
    const updateDraftContractName = (contractId: string, newName: string) => console.log('updateDraftContractName not implemented');
    const deleteDraftContract = (contractId: string) => console.log('deleteDraftContract not implemented');


    const selectedProject = useMemo(() => {
        return projects?.find(p => p.id === selectedProjectId) || null;
    }, [selectedProjectId, projects]);

    const value: ProjectContextType = {
        projects: projects ?? null,
        selectedProject,
        selectProject,
        addProject,
        updateProjectName,
        deleteProject,
        updateDraftContractName,
        deleteDraftContract,
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
