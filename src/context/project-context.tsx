"use client";

import React, { createContext, useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { Project } from './types';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { addDoc, collection, deleteDoc, doc, query, updateDoc, where } from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';


interface ProjectContextType {
    projects: Project[] | null;
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
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => getInitialState('selectedProjectId', null));

    const projectsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, "projects"), where("ownerId", "==", user.uid));
    }, [firestore, user]);

    const { data: projects, loading } = useCollection<Project>(projectsQuery);

    const selectedProject = useMemo(() => {
        if (!projects || projects.length === 0) return null;
        
        const projectExists = projects.some(p => p.id === selectedProjectId);
        if (selectedProjectId && projectExists) {
            return projects.find(p => p.id === selectedProjectId) || null;
        } 
        
        if (projects.length > 0) {
            const firstProject = projects[0];
            setSelectedProjectId(firstProject.id);
            return firstProject;
        }
        
        return null;
        
    }, [selectedProjectId, projects]);

    useEffect(() => {
        if (selectedProject) {
            localStorage.setItem('selectedProjectId', JSON.stringify(selectedProject.id));
        } else if (!loading && (!projects || projects.length === 0)) {
            setSelectedProjectId(null);
            localStorage.removeItem('selectedProjectId');
        }
    }, [selectedProject, projects, loading]);


    const selectProject = (projectId: string | null) => {
        setSelectedProjectId(projectId);
    };

    const addProject = useCallback(async (projectName: string) => {
        if (!firestore || !user) {
            toast({ title: "Hata", description: "Kullanıcı girişi yapmalısınız.", variant: "destructive" });
            return;
        }
        const newProjectData = { name: projectName, ownerId: user.uid };
        addDoc(collection(firestore, "projects"), newProjectData)
            .then((newProjectRef) => {
                selectProject(newProjectRef.id);
                toast({ title: "Proje oluşturuldu!" });
            }).catch(err => {
                const permissionError = new FirestorePermissionError({ path: '/projects', operation: 'create', requestResourceData: newProjectData });
                errorEmitter.emit('permission-error', permissionError);
            });
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
        
        const projectRef = doc(firestore, "projects", projectId);
        deleteDoc(projectRef)
            .then(() => {
                toast({ title: "Proje Silindi" });
                if (selectedProjectId === projectId) {
                    selectProject(null);
                }
            })
            .catch(err => {
                const permissionError = new FirestorePermissionError({ path: projectRef.path, operation: 'delete' });
                errorEmitter.emit('permission-error', permissionError);
            });
    }, [firestore, selectedProjectId, toast]);
    

    const value: ProjectContextType = {
        projects: projects,
        selectedProject,
        selectProject,
        addProject,
        updateProjectName,
        deleteProject,
        loading: isUserLoading || loading,
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
