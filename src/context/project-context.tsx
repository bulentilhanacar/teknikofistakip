
"use client";

import React, { createContext, useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { Project } from './types';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, errorEmitter, useCollection, useMemoFirebase } from '@/firebase';
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';


interface ProjectContextType {
    projects: Project[] | null;
    setProjects: (projects: Project[]) => void;
    selectedProject: Project | null;
    selectProject: (projectId: string | null) => void;
    addProject: (projectName: string) => Promise<void>;
    updateProjectName: (projectId: string, newName: string) => void;
    deleteProject: (projectId: string) => Promise<void>;
    loading: boolean;
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

    const { data: projects, loading } = useCollection<Project>(projectsQuery);
    
    const selectedProject = useMemo(() => {
        if (!projects) return null;
        const currentProjectExists = projects.some(p => p.id === selectedProjectId);
        
        if (selectedProjectId && currentProjectExists) {
            return projects.find(p => p.id === selectedProjectId) || null;
        } else if (projects.length > 0) {
            const firstProjectId = projects[0].id;
            setSelectedProjectId(firstProjectId);
            return projects[0];
        }
        
        return null;
    }, [selectedProjectId, projects]);
    
    useEffect(() => {
        if (selectedProjectId) {
            localStorage.setItem('selectedProjectId', JSON.stringify(selectedProjectId));
        } else {
             localStorage.removeItem('selectedProjectId');
        }
    }, [selectedProjectId]);

    useEffect(() => {
        if (!user) {
            setSelectedProjectId(null);
        }
    }, [user]);
    
    const selectProject = (projectId: string | null) => {
        setSelectedProjectId(projectId);
    };

    const addProject = useCallback(async (projectName: string) => {
        if (!firestore || !user) {
            toast({ title: "Hata", description: "Proje eklemek için giriş yapmalısınız.", variant: "destructive" });
            return;
        }
        try {
            const newProjectData = {
                name: projectName,
                ownerId: user.uid,
            };
            const newProjectRef = await addDoc(collection(firestore, "projects"), newProjectData);
            selectProject(newProjectRef.id);
            toast({ title: "Proje oluşturuldu!" });
        } catch (err) {
            const permissionError = new FirestorePermissionError({ path: '/projects', operation: 'create', requestResourceData: { name: projectName, ownerId: user.uid } });
            errorEmitter.emit('permission-error', permissionError);
        }
    }, [firestore, user, toast]);
    
    const updateProjectName = (projectId: string, newName: string) => {
         if (!firestore) return;
         const projectRef = doc(firestore, 'projects', projectId);
         updateDoc(projectRef, { name: newName })
            .catch(err => {
                 const permissionError = new FirestorePermissionError({ path: projectRef.path, operation: 'update', requestResourceData: { name: newName } });
                 errorEmitter.emit('permission-error', permissionError);
            });
    };

    const deleteProject = useCallback(async (projectId: string) => {
        if (!firestore) return;

        const contractsRef = collection(firestore, 'projects', projectId, 'contracts');
        const contractsSnapshot = await getDocs(contractsRef);

        if (!contractsSnapshot.empty) {
            toast({
                variant: 'destructive',
                title: 'Hata',
                description: 'Bu projeye ait sözleşmeler bulunduğu için SİLİNEMEZ. Projeyi silebilmeniz için ÖNCE projedeki Ana ve Alt sözleşme gruplarındaki tüm sözleşmeleri silmeniz gerekmektedir.',
                duration: 5000,
            });
            return;
        }
        
        const projectRef = doc(firestore, "projects", projectId);
        deleteDoc(projectRef)
            .then(() => {
                toast({ title: "Proje silindi." });
                const updatedProjects = projects ? projects.filter(p => p.id !== projectId) : [];
                if (selectedProjectId === projectId) {
                    selectProject(updatedProjects.length > 0 ? updatedProjects[0].id : null);
                }
            })
            .catch(err => {
                const permissionError = new FirestorePermissionError({ path: projectRef.path, operation: 'delete' });
                errorEmitter.emit('permission-error', permissionError);
            });
    }, [firestore, toast, projects, selectedProjectId]);
    

    const value: ProjectContextType = {
        projects,
        setProjects: () => {}, // This is a placeholder, as useCollection now manages the state
        selectedProject,
        selectProject,
        addProject,
        updateProjectName,
        deleteProject,
        loading,
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
