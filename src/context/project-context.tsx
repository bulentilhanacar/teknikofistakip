
"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { Project } from './types';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { useUser } from '@/firebase/provider';
import { collection, doc, getDoc, setDoc, addDoc, onSnapshot, Unsubscribe, deleteDoc, query, updateDoc, where } from 'firebase/firestore';

type UserAppStatus = 'loading' | 'pending' | 'approved' | 'admin' | 'error';

interface ProjectContextType {
    projects: Project[] | null;
    selectedProject: Project | null;
    loading: boolean;
    user: ReturnType<typeof useUser>['user'];
    isAdmin: boolean;
    userAppStatus: UserAppStatus;
    addProject: (name: string) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    updateProject: (id: string, name: string) => Promise<void>;
    setSelectedProjectById: (id: string | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user, loading: userLoading } = useUser();
    
    const [projects, setProjects] = useState<Project[] | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userAppStatus, setUserAppStatus] = useState<UserAppStatus>('loading');
    
    const loading = userLoading || userAppStatus === 'loading';

    const addProject = useCallback(async (name: string) => {
        if (!firestore || !isAdmin) {
            toast({ title: "Yetki Hatası", description: "Proje ekleme yetkiniz yok.", variant: "destructive" });
            return;
        }
        try {
            await addDoc(collection(firestore, "projects"), { name });
            toast({ title: "Proje Eklendi", description: `${name} projesi başarıyla eklendi.` });
        } catch (error) {
            console.error("Error adding project: ", error);
            toast({ title: "Hata", description: "Proje eklenirken bir sorun oluştu.", variant: "destructive" });
        }
    }, [firestore, isAdmin, toast]);

    const deleteProject = useCallback(async (id: string) => {
        if (!firestore || !isAdmin) {
            toast({ title: "Yetki Hatası", description: "Proje silme yetkiniz yok.", variant: "destructive" });
            return;
        }
        try {
            // TODO: Delete subcollections as well using a cloud function or batch writes client-side
            await deleteDoc(doc(firestore, "projects", id));
            toast({ title: "Proje Silindi" });
        } catch (error) {
            console.error("Error deleting project: ", error);
            toast({ title: "Hata", description: "Proje silinirken bir sorun oluştu.", variant: "destructive" });
        }
    }, [firestore, isAdmin, toast]);

    const updateProject = useCallback(async (id: string, name: string) => {
        if (!firestore || !isAdmin) {
            toast({ title: "Yetki Hatası", description: "Proje güncelleme yetkiniz yok.", variant: "destructive" });
            return;
        }
        try {
            await updateDoc(doc(firestore, "projects", id), { name });
            toast({ title: "Proje Güncellendi" });
        } catch (error) {
            console.error("Error updating project: ", error);
            toast({ title: "Hata", description: "Proje güncellenirken bir sorun oluştu.", variant: "destructive" });
        }
    }, [firestore, isAdmin, toast]);

    const setSelectedProjectById = useCallback((id: string | null) => {
        if (id === null) {
            setSelectedProject(null);
            return;
        }
        const project = projects?.find(p => p.id === id) || null;
        setSelectedProject(project);
    }, [projects]);


    useEffect(() => {
        if (userLoading) {
            setUserAppStatus('loading');
            return;
        }

        if (!user) {
            setUserAppStatus('approved');
            setIsAdmin(false);
            setProjects(null);
            setSelectedProject(null);
            return;
        }

        if (!firestore) {
            setUserAppStatus('error');
            return;
        };

        let projectsUnsubscribe: Unsubscribe | null = null;
        
        const setupUserAndProjects = async () => {
            setUserAppStatus('loading');
            const isAdminByEmail = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
            const userRef = doc(firestore, 'users', user.uid);
            
            try {
                const userDoc = await getDoc(userRef);
                let finalStatus: UserAppStatus = 'pending';
                let finalIsAdmin = false;

                if (!userDoc.exists()) {
                    const userData = {
                        email: user.email,
                        role: isAdminByEmail ? 'admin' : 'user',
                        status: isAdminByEmail ? 'approved' : 'pending',
                    };
                    await setDoc(userRef, userData);
                    finalIsAdmin = isAdminByEmail;
                    finalStatus = isAdminByEmail ? 'admin' : 'pending';
                } else {
                    const userData = userDoc.data();
                    finalIsAdmin = userData.role === 'admin';
                    if (finalIsAdmin && userData.status !== 'approved') {
                        await updateDoc(userRef, { status: 'approved' });
                        finalStatus = 'admin';
                    } else {
                        finalStatus = userData.status === 'approved' ? (finalIsAdmin ? 'admin' : 'approved') : 'pending';
                    }
                }
                
                setIsAdmin(finalIsAdmin);
                setUserAppStatus(finalStatus);

                if (finalStatus === 'approved' || finalStatus === 'admin') {
                    const projectCollection = collection(firestore, "projects");
                    projectsUnsubscribe = onSnapshot(projectCollection, (querySnapshot) => {
                        const allProjects = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Project));
                        setProjects(allProjects);

                        if (selectedProject && !allProjects.some(p => p.id === selectedProject.id)) {
                            setSelectedProject(null);
                        }

                    }, (error) => {
                        console.error("Error fetching projects: ", error);
                        setProjects([]);
                        toast({ title: "Projeler Yüklenemedi", variant: "destructive" });
                    });
                } else {
                    setProjects(null);
                    setSelectedProject(null);
                }
            } catch (error) {
                console.error("Error during user and project setup:", error);
                toast({ title: "Kurulum Hatası", description: "Kullanıcı veya proje verileri ayarlanırken bir sorun oluştu.", variant: "destructive" });
                setUserAppStatus('error');
            }
        };

        setupUserAndProjects();

        return () => {
            if (projectsUnsubscribe) {
                projectsUnsubscribe();
            }
        };
    }, [user, userLoading, firestore, toast, selectedProject]);

    const value: ProjectContextType = {
        projects,
        selectedProject,
        loading,
        user,
        isAdmin,
        userAppStatus,
        addProject,
        deleteProject,
        updateProject,
        setSelectedProjectById,
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
