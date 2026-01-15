
"use client";

import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { Project } from './types';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useUser } from '@/firebase/provider';
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore';

interface ProjectContextType {
    projects: Project[] | null;
    selectedProject: Project | null;
    loading: boolean;
    addProject: (name: string) => Promise<void>;
    selectProject: (id: string) => void;
    renameProject: (id: string, newName: string) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user, loading: userLoading } = useUser();
    
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

    const projectsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, "projects"), where("ownerId", "==", user.uid));
    }, [firestore, user]);
    
    const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

    const loading = userLoading || projectsLoading;

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedId = localStorage.getItem('selectedProjectId');
            if (storedId) {
                setSelectedProjectId(storedId);
            }
        }
    }, []);

    useEffect(() => {
        if (!loading && projects) {
            if (projects.length > 0) {
                const storedId = localStorage.getItem('selectedProjectId');
                const projectExists = projects.some(p => p.id === storedId);
                if (storedId && projectExists) {
                    setSelectedProjectId(storedId);
                } else {
                    setSelectedProjectId(projects[0].id);
                }
            } else {
                setSelectedProjectId(null);
            }
        }
    }, [projects, loading]);

    const selectProject = (id: string) => {
        setSelectedProjectId(id);
        localStorage.setItem('selectedProjectId', id);
    };

    const addProject = async (name: string) => {
        if (!firestore || !user) return;
        try {
            const newProjectRef = await addDoc(collection(firestore, "projects"), {
                name,
                ownerId: user.uid
            });
            toast({ title: "Proje oluşturuldu." });
            selectProject(newProjectRef.id);
        } catch (error) {
            console.error("Error adding project:", error);
            toast({ title: "Hata", description: "Proje oluşturulamadı.", variant: "destructive" });
        }
    };

    const renameProject = async (id: string, newName: string) => {
        if (!firestore) return;
        try {
            await updateDoc(doc(firestore, "projects", id), { name: newName });
            toast({ title: "Proje yeniden adlandırıldı." });
        } catch (error) {
            console.error("Error renaming project:", error);
            toast({ title: "Hata", description: "Proje yeniden adlandırılamadı.", variant: "destructive" });
        }
    };

    const deleteProject = async (id: string) => {
        if (!firestore) return;
        try {
            // This is a simple delete. A real app would need to delete all sub-collections (contracts, etc.)
            await deleteDoc(doc(firestore, "projects", id));
            toast({ title: "Proje silindi." });
            if (selectedProjectId === id) {
                if (projects && projects.length > 1) {
                    const newSelected = projects.find(p => p.id !== id);
                    if (newSelected) selectProject(newSelected.id);
                } else {
                    setSelectedProjectId(null);
                    localStorage.removeItem('selectedProjectId');
                }
            }
        } catch (error) {
            console.error("Error deleting project:", error);
            toast({ title: "Hata", description: "Proje silinemedi.", variant: "destructive" });
        }
    };
    
    const selectedProject = projects?.find(p => p.id === selectedProjectId) || null;

    const value: ProjectContextType = {
        projects,
        selectedProject,
        loading,
        addProject,
        selectProject,
        renameProject,
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
