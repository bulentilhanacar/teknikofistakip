
"use client";

import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { Project } from './types';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useUser } from '@/firebase/provider';
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where, writeBatch, setDoc, getDoc } from 'firebase/firestore';

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
    const [dataLoading, setDataLoading] = useState(true);

    // This effect determines the user's role and manages their record in Firestore.
    useEffect(() => {
        if (userLoading) return;
        if (!user || !firestore) {
            setIsAdmin(false);
            setDataLoading(false);
            return;
        }

        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
        const isDesignatedAdmin = user.email === adminEmail;
        setIsAdmin(isDesignatedAdmin);

        const userRef = doc(firestore, 'users', user.uid);
        const userByEmailRef = doc(firestore, 'users_by_email', user.email!);

        const setupUser = async () => {
            try {
                const userDoc = await getDoc(userRef);
                const userByEmailDoc = await getDoc(userByEmailRef);

                const role = isDesignatedAdmin ? 'admin' : 'user';
                const userData = { email: user.email, role };

                if (!userDoc.exists() || userDoc.data().role !== role) {
                    await setDoc(userRef, userData, { merge: true });
                }
                if (!userByEmailDoc.exists() || userByEmailDoc.data().role !== role) {
                     await setDoc(userByEmailRef, { email: user.email, role }, { merge: true });
                }
            } catch (error) {
                console.error("Error setting up user role:", error);
                toast({ title: "Hata", description: "Kullanıcı rolü ayarlanırken bir sorun oluştu.", variant: "destructive" });
            }
        };

        setupUser();

    }, [user, userLoading, firestore, toast]);

    const projectsQuery = useMemoFirebase(() => {
        if (userLoading || !user || !firestore) return null;
        
        if (isAdmin) {
            // Admin sees all projects
            return collection(firestore, "projects");
        }
        // Regular user sees only their projects
        return query(collection(firestore, "projects"), where("ownerId", "==", user.uid));
    }, [firestore, user, isAdmin, userLoading]);
    
    const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

    useEffect(() => {
        setDataLoading(userLoading || projectsLoading);
    }, [userLoading, projectsLoading])


    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedId = localStorage.getItem('selectedProjectId');
            if (storedId) {
                setSelectedProjectId(storedId);
            }
        }
    }, []);

    useEffect(() => {
        if (!dataLoading && projects) {
            if (projects.length > 0) {
                const storedId = localStorage.getItem('selectedProjectId');
                const projectExists = projects.some(p => p.id === storedId);

                if (storedId && projectExists) {
                    setSelectedProjectId(storedId);
                } else {
                    setSelectedProjectId(projects[0].id);
                    localStorage.setItem('selectedProjectId', projects[0].id);
                }
            } else {
                setSelectedProjectId(null);
                localStorage.removeItem('selectedProjectId');
            }
        }
    }, [projects, dataLoading]);

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

        if (!isAdmin && projectToDelete.ownerId !== user.uid) {
             toast({ title: "Hata", description: "Bu projeyi silme yetkiniz yok.", variant: "destructive" });
             return;
        }

        try {
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
        loading: dataLoading,
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
