
"use client";

import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { Project } from './types';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useUser } from '@/firebase/provider';
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore';

interface AppUser {
    id: string;
    email: string;
    role: 'admin' | 'user';
}
interface ProjectContextType {
    projects: Project[] | null;
    selectedProject: Project | null;
    loading: boolean;
    addProject: (name: string) => Promise<void>;
    selectProject: (id: string) => void;
    renameProject: (id: string, newName: string) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    user: ReturnType<typeof useUser>['user'];
    isAdmin: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user, loading: userLoading } = useUser();
    
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    // Fetch user role
    const userRoleQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, "users"), where("email", "==", user.email));
    }, [firestore, user]);
    const { data: userData, isLoading: userRoleLoading } = useCollection<AppUser>(userRoleQuery);

    useEffect(() => {
        if (userData && userData.length > 0) {
            setIsAdmin(userData[0].role === 'admin');
        } else {
            setIsAdmin(false);
        }
    }, [userData]);


    const projectsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        if (isAdmin) {
             // Admin sees all projects
            return collection(firestore, "projects");
        }
        // Regular user sees only their projects
        return query(collection(firestore, "projects"), where("ownerId", "==", user.uid));
    }, [firestore, user, isAdmin]);
    
    const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

    const loading = userLoading || projectsLoading || userRoleLoading;

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

                // If user is not an admin, ensure they can only see their own selected project
                const selectedProjectData = projects.find(p => p.id === storedId);
                const isOwner = selectedProjectData?.ownerId === user?.uid;

                if (storedId && projectExists && (isAdmin || isOwner)) {
                    setSelectedProjectId(storedId);
                } else {
                    // Fallback to first available project
                    setSelectedProjectId(projects[0].id);
                    localStorage.setItem('selectedProjectId', projects[0].id);
                }
            } else {
                setSelectedProjectId(null);
                localStorage.removeItem('selectedProjectId');
            }
        }
    }, [projects, loading, isAdmin, user]);

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
        if (!firestore || !user) return;
        
        const projectToDelete = projects?.find(p => p.id === id);
        if (!projectToDelete) return;

        // Security check: only admin or owner can delete
        if (!isAdmin && projectToDelete.ownerId !== user.uid) {
             toast({ title: "Hata", description: "Bu projeyi silme yetkiniz yok.", variant: "destructive" });
             return;
        }

        try {
            // In a real app, you would need to delete all sub-collections (contracts, etc.)
            // This requires a Cloud Function for robust deletion.
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
    
    // Final check to ensure a non-admin isn't viewing a project they don't own
    if (!loading && selectedProject && !isAdmin && selectedProject.ownerId !== user?.uid) {
        return (
            <ProjectContext.Provider value={{
                projects: null,
                selectedProject: null,
                loading: true, // Keep loading state to prevent flicker
                addProject,
                selectProject,
                renameProject,
                deleteProject,
                user,
                isAdmin: false,
            }}>
                {children}
            </ProjectContext.Provider>
        );
    }

    const value: ProjectContextType = {
        projects,
        selectedProject,
        loading,
        addProject,
        selectProject,
        renameProject,
        deleteProject,
        user,
        isAdmin,
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
