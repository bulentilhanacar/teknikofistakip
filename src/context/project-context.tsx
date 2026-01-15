"use client";

import React, { createContext, useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { Project } from './types';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { addDoc, collection, deleteDoc, doc, query, updateDoc, where } from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';


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

export const ProjectProvider = ({ children }: { children: React.ReactNode }) => {
    const { toast } = useToast();
    const { user, auth, isUserLoading } = useUser();
    
    let firestore: any;
    try {
        firestore = useFirestore();
    } catch (e) {
        firestore = null;
    }

    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const projectsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, "projects"), where("ownerId", "==", user.uid));
    }, [firestore, user]);

    const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const storedProjectId = localStorage.getItem('selectedProjectId');
                if (storedProjectId) {
                    setSelectedProjectId(JSON.parse(storedProjectId));
                }
            } catch (error) {
                console.error("Could not access localStorage:", error);
            }
        }
        setIsInitialLoad(false);
    }, []);

    const selectedProject = useMemo(() => {
        if (isInitialLoad || !projects) return null;
        
        const projectExists = projects.some(p => p.id === selectedProjectId);

        if (selectedProjectId && projectExists) {
            return projects.find(p => p.id === selectedProjectId) || null;
        } 
        
        if (projects.length > 0) {
            const firstProject = projects[0];
            if (selectedProjectId !== firstProject.id) {
                 setSelectedProjectId(firstProject.id);
            }
            return firstProject;
        }
        
        if(selectedProjectId !== null) {
            setSelectedProjectId(null);
        }
        return null;
        
    }, [selectedProjectId, projects, isInitialLoad]);

    useEffect(() => {
        if (isInitialLoad) return;
        
        if (typeof window !== 'undefined') {
            try {
                if (selectedProject) {
                    localStorage.setItem('selectedProjectId', JSON.stringify(selectedProject.id));
                } else {
                    localStorage.removeItem('selectedProjectId');
                }
            } catch (error) {
                 console.error("Could not access localStorage:", error);
            }
        }
    }, [selectedProject, isInitialLoad]);


    const addProject = useCallback(async (projectName: string) => {
        if (!firestore || !user) {
            toast({ title: "Hata", description: "Kullanıcı girişi yapmalısınız veya Firebase başlatılamadı.", variant: "destructive" });
            return;
        }
        const newProjectData = { name: projectName, ownerId: user.uid };
        try {
            const newProjectRef = await addDoc(collection(firestore, "projects"), newProjectData);
            selectProject(newProjectRef.id);
            toast({ title: "Proje oluşturuldu!" });
        } catch(err) {
            const permissionError = new FirestorePermissionError({ path: '/projects', operation: 'create', requestResourceData: newProjectData, authObject: auth });
            console.error(permissionError);
            toast({ title: "İzin Hatası", description: "Proje oluşturma izniniz yok.", variant: "destructive" });
        };
    }, [firestore, user, toast, auth]);
    
    const updateProjectName = (projectId: string, newName: string) => {
         if (!firestore) return;
         const projectRef = doc(firestore, 'projects', projectId);
         updateDoc(projectRef, { name: newName })
            .catch(err => {
                 const permissionError = new FirestorePermissionError({ path: projectRef.path, operation: 'update', requestResourceData: { name: newName }, authObject: auth });
                 console.error(permissionError);
                 toast({ title: "İzin Hatası", description: "Projeyi güncelleme izniniz yok.", variant: "destructive" });
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
                const permissionError = new FirestorePermissionError({ path: projectRef.path, operation: 'delete', authObject: auth });
                console.error(permissionError);
                toast({ title: "İzin Hatası", description: "Projeyi silme izniniz yok.", variant: "destructive" });
            });
    }, [firestore, selectedProjectId, toast, auth]);
    

    const value: ProjectContextType = {
        projects: projects,
        selectedProject,
        selectProject: setSelectedProjectId,
        addProject,
        updateProjectName,
        deleteProject,
        loading: isUserLoading || projectsLoading || isInitialLoad || !firestore,
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
