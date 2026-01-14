
"use client";

import React, { createContext, useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { Project } from './types';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, errorEmitter } from '@/firebase';
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';


interface ProjectContextType {
    projects: Project[] | null;
    setProjects: React.Dispatch<React.SetStateAction<Project[] | null>>;
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

    const [projects, setProjects] = useState<Project[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => getInitialState('selectedProjectId', null));

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
        if (!user) {
            setProjects(null);
            setSelectedProjectId(null);
            setLoading(false);
        } else {
            setLoading(true);
        }
    }, [user]);

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
        if (!firestore || !user) {
            toast({ title: "Hata", description: "Proje eklemek için giriş yapmalısınız.", variant: "destructive" });
            return;
        }
        setLoading(true);
        try {
            const newProjectData = {
                name: projectName,
                ownerId: user.uid,
            };
            const newProjectRef = await addDoc(collection(firestore, "projects"), newProjectData);
            
            const newProject = { id: newProjectRef.id, ...newProjectData };
            setProjects(prev => (prev ? [...prev, newProject] : [newProject]));
            selectProject(newProjectRef.id);
            
            toast({ title: "Proje oluşturuldu!" });
        } catch (err) {
            const permissionError = new FirestorePermissionError({ path: '/projects', operation: 'create', requestResourceData: { name: projectName, ownerId: user.uid } });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
            setLoading(false);
        }
    }, [firestore, user, toast]);
    
    const updateProjectName = (projectId: string, newName: string) => {
         if (!firestore) return;
         const projectRef = doc(firestore, 'projects', projectId);
         updateDoc(projectRef, { name: newName })
            .then(() => {
                setProjects(prev => prev ? prev.map(p => p.id === projectId ? { ...p, name: newName } : p) : null);
            })
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
                toast({ title: "Proje silindi." });
                const updatedProjects = projects ? projects.filter(p => p.id !== projectId) : [];
                setProjects(updatedProjects);
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
