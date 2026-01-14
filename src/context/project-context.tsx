"use client";

import React, { createContext, useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { Contract, ContractGroupKeys, ContractItem, Deduction, ProgressPayment, ExtraWorkItem, ProgressPaymentStatus, Project } from './types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useUser, useCollection, useDoc, useFirestore, useAuth, errorEmitter, useMemoFirebase } from '@/firebase';
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';


interface ProjectContextType {
    projects: Project[] | null;
    selectedProject: Project | null;
    selectProject: (projectId: string | null) => void;
    addProject: (projectName: string) => Promise<void>;
    updateProjectName: (projectId: string, newName: string) => void;
    deleteProject: (projectId: string) => Promise<void>;
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
    const { user } = useUser();
    const firestore = useFirestore();

    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => getInitialState('selectedProjectId', null));

    const projectsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, "projects"), where("ownerId", "==", user.uid));
    }, [firestore, user]);

    const { data: projects, loading: projectsLoading } = useCollection<Project>(projectsQuery);

    const selectedProject = useMemo(() => {
        if (projectsLoading || !projects) return null;
        if (selectedProjectId === null && projects.length > 0) {
            const firstProjectId = projects[0].id;
            setSelectedProjectId(firstProjectId);
            return projects[0];
        }
        const project = projects.find(p => p.id === selectedProjectId);
        if (project) {
            return project;
        }
        if (projects.length > 0) {
            const firstProjectId = projects[0].id;
            setSelectedProjectId(firstProjectId);
            return projects[0];
        }
        return null;
    }, [selectedProjectId, projects, projectsLoading]);
    
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
        if (!firestore || !user) return;
        try {
            const newProjectData = {
                name: projectName,
                ownerId: user.uid,
            };
            const newProjectRef = await addDoc(collection(firestore, "projects"), newProjectData);
            toast({ title: "Proje oluşturuldu!" });
        } catch (err) {
            const permissionError = new FirestorePermissionError({ path: '/projects', operation: 'create', requestResourceData: { name: projectName, ownerId: user.uid } });
            errorEmitter.emit('permission-error', permissionError);
        }
    }, [firestore, user, toast]);
    
    const updateProjectName = (projectId: string, newName: string) => {
         if (!firestore || !selectedProject) return;
         const contractRef = doc(firestore, 'projects', projectId);
         updateDoc(contractRef, { name: newName })
            .catch(err => {
                 const permissionError = new FirestorePermissionError({ path: contractRef.path, operation: 'update', requestResourceData: { name: newName } });
                 errorEmitter.emit('permission-error', permissionError);
            });
    };

    const deleteProject = useCallback(async (projectId: string) => {
        if (!firestore) return;

        // Check for contracts before deleting
        const contractsRef = collection(firestore, 'projects', projectId, 'contracts');
        const contractsSnapshot = await getDocs(contractsRef);

        if (!contractsSnapshot.empty) {
            toast({
                variant: 'destructive',
                title: 'Hata',
                description: 'Bu projeye ait sözleşmeler bulunduğu için SİLİNEMEZ. Projeyi silebilmeniz için ÖNCE projedeki Ana ve Alt sözleşme gruplarındaki tüm sözleşmeleri silmeniz gerekmektedir.',
            });
            return;
        }
        
        const projectRef = doc(firestore, "projects", projectId);
        deleteDoc(projectRef)
            .then(() => {
                toast({ title: "Proje silindi." });
                 const nextSelectedId = projects && projects.length > 1 
                    ? (projects.find(p => p.id !== projectId)?.id ?? null) 
                    : null;
                selectProject(nextSelectedId);
            })
            .catch(err => {
                const permissionError = new FirestorePermissionError({ path: projectRef.path, operation: 'delete' });
                errorEmitter.emit('permission-error', permissionError);
            });
    }, [firestore, toast, projects]);


    const value: ProjectContextType = {
        projects: projects ?? null,
        selectedProject,
        selectProject,
        addProject,
        updateProjectName,
        deleteProject,
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
