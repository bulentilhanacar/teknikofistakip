
"use client";

import React, { createContext, useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { Project } from './types';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, errorEmitter, useCollection, useMemoFirebase } from '@/firebase';
import { addDoc, collection, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';


interface ProjectContextType {
    projects: Project[] | null;
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
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

    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => getInitialState('selectedProjectId', null));


    useEffect(() => {
        if (projects === null) {
            setLoading(true);
        } else {
            setLoading(false);
        }
    }, [projects]);
    
    useEffect(() => {
        if (!user) {
            setProjects([]);
            setSelectedProjectId(null);
        }
    }, [user]);

    const selectedProject = useMemo(() => {
        if (!projects || projects.length === 0) return null;
        const currentProjectExists = projects.some(p => p.id === selectedProjectId);
        
        if (selectedProjectId && currentProjectExists) {
            return projects.find(p => p.id === selectedProjectId) || null;
        } else {
            const firstProjectId = projects[0].id;
            // This causes a re-render, so we should do it in an effect.
            // However, it's safer to just derive state.
            return projects[0];
        }
        
    }, [selectedProjectId, projects]);

    // Effect to update localStorage and handle deselection
    useEffect(() => {
        const projectExists = projects?.some(p => p.id === selectedProjectId);
        if (selectedProjectId && projectExists) {
             localStorage.setItem('selectedProjectId', JSON.stringify(selectedProjectId));
        } else if (projects && projects.length > 0) {
            // If selected project is gone, select the first one
            setSelectedProjectId(projects[0].id);
        } else if (!projects || projects.length === 0) {
            // No projects left
            setSelectedProjectId(null);
            localStorage.removeItem('selectedProjectId');
        }

    }, [selectedProjectId, projects]);

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
            
            // The useCollection hook will automatically update the projects list
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
        
        const projectRef = doc(firestore, "projects", projectId);
        deleteDoc(projectRef)
            .catch(err => {
                const permissionError = new FirestorePermissionError({ path: projectRef.path, operation: 'delete' });
                errorEmitter.emit('permission-error', permissionError);
            });
    }, [firestore, toast]);
    

    const value: ProjectContextType = {
        projects: projects,
        setProjects,
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
