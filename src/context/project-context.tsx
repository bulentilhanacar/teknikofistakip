
"use client";

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Project } from './types';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { addDoc, collection, getDocs, query, limit } from 'firebase/firestore';

const SHARED_PROJECT_NAME = "Genel Proje";

interface ProjectContextType {
    projects: Project[] | null;
    selectedProject: Project | null;
    loading: boolean;
}

const ProjectContext = createContext<ProjectContextType>({
    projects: null,
    selectedProject: null,
    loading: true,
});

export const ProjectProvider = ({ children }: { children: React.ReactNode }) => {
    const { toast } = useToast();
    const firestore = useFirestore();

    const [sharedProject, setSharedProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    const findOrCreateSharedProject = useCallback(async () => {
        if (!firestore) return;
        setLoading(true);
        try {
            const projectsRef = collection(firestore, "projects");
            const q = query(projectsRef, limit(1));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const projectDoc = querySnapshot.docs[0];
                setSharedProject({ ...projectDoc.data() as Omit<Project, 'id'>, id: projectDoc.id });
            } else {
                console.log("No shared project found, creating one.");
                const newProjectData = { name: SHARED_PROJECT_NAME };
                const newProjectRef = await addDoc(projectsRef, newProjectData);
                setSharedProject({ ...newProjectData, id: newProjectRef.id });
                toast({ title: "Genel proje oluşturuldu!" });
            }
        } catch (error) {
            console.error("Error finding or creating shared project:", error);
            toast({ title: "Hata", description: "Proje verisi yüklenemedi.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [firestore, toast]);
    
    useEffect(() => {
        if (firestore) {
            findOrCreateSharedProject();
        }
    }, [firestore, findOrCreateSharedProject]);


    const value: ProjectContextType = {
        projects: sharedProject ? [sharedProject] : null,
        selectedProject: sharedProject,
        loading: loading,
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
