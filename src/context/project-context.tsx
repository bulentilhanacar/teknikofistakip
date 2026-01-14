"use client";

import React, { createContext, useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { Contract, ContractGroupKeys, ContractItem, Deduction, ProgressPayment, ExtraWorkItem, ProgressPaymentStatus, Project } from './types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useUser, useCollection, useDoc, useFirestore, useAuth, errorEmitter } from '@/firebase';
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';


interface ProjectContextType {
    projects: Project[] | null;
    selectedProject: Project | null;
    selectProject: (projectId: string | null) => void;
    addProject: (projectName: string) => void;
    updateProjectName: (projectId: string, newName: string) => void;
    deleteProject: (projectId: string) => void;
    updateDraftContractName: (contractId: string, newName: string) => void;
    deleteDraftContract: (contractId: string) => void;
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

    const projectsQuery = useMemo(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, "projects"), where("ownerId", "==", user.uid));
    }, [firestore, user]);

    const { data: projects, loading: projectsLoading } = useCollection<Project>(projectsQuery);

    const selectedProject = useMemo(() => {
        return projects?.find(p => p.id === selectedProjectId) || null;
    }, [selectedProjectId, projects]);
    
    useEffect(() => {
        if (!projectsLoading && projects && projects.length > 0) {
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
        if (!firestore  || !user) return;
        const newProjectData = {
            name: projectName,
            ownerId: user.uid,
        };
        addDoc(collection(firestore, "projects"), newProjectData)
        .then((newProjectRef) => {
            setSelectedProjectId(newProjectRef.id);
            toast({ title: "Proje oluşturuldu!" });
        })
        .catch(err => {
            const permissionError = new FirestorePermissionError({ path: '/projects', operation: 'create', requestResourceData: newProjectData });
            errorEmitter.emit('permission-error', permissionError);
        });

    }, [firestore, user, toast]);
    
    const updateProjectName = useCallback(async (projectId: string, newName: string) => {
        if (!firestore) return;
        const projectRef = doc(firestore, "projects", projectId);
        updateDoc(projectRef, { name: newName })
            .then(() => toast({ title: "Proje güncellendi." }))
            .catch(err => {
                const permissionError = new FirestorePermissionError({ path: `/projects/${projectId}`, operation: 'update', requestResourceData: { name: newName } });
                errorEmitter.emit('permission-error', permissionError);
            });
    }, [firestore, toast]);

    const deleteProject = useCallback(async (projectId: string) => {
        if (!firestore) return;
        // This is a simplified delete. In a real app, you'd want to delete all subcollections too.
        // This would require a Cloud Function for full cleanup.
        const projectRef = doc(firestore, "projects", projectId);
        deleteDoc(projectRef)
            .then(() => {
                if (selectedProjectId === projectId) {
                    const remainingProjects = projects?.filter(p => p.id !== projectId);
                    setSelectedProjectId(remainingProjects && remainingProjects.length > 0 ? remainingProjects[0].id : null);
                }
                toast({ title: "Proje silindi." });
            })
            .catch(err => {
                const permissionError = new FirestorePermissionError({ path: projectRef.path, operation: 'delete' });
                errorEmitter.emit('permission-error', permissionError);
            });
    }, [firestore, toast, selectedProjectId, projects]);
    
    const updateDraftContractName = useCallback(async (contractId: string, newName: string) => {
         if (!firestore || !selectedProject) return;
         const contractRef = doc(firestore, `projects/${selectedProject.id}/contracts`, contractId);
         updateDoc(contractRef, { name: newName })
            .then(() => toast({ title: "Taslak adı güncellendi." }))
            .catch(err => {
                 const permissionError = new FirestorePermissionError({ path: contractRef.path, operation: 'update', requestResourceData: { name: newName } });
                 errorEmitter.emit('permission-error', permissionError);
            });
    }, [firestore, selectedProject, toast]);
    
    const deleteDraftContract = useCallback(async (contractId: string) => {
        if (!firestore || !selectedProject) return;
        const contractRef = doc(firestore, `projects/${selectedProject.id}/contracts`, contractId);
        deleteDoc(contractRef)
            .then(() => toast({ title: "Taslak silindi." }))
            .catch(err => {
                const permissionError = new FirestorePermissionError({ path: contractRef.path, operation: 'delete' });
                errorEmitter.emit('permission-error', permissionError);
            });
    }, [firestore, selectedProject, toast]);


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
