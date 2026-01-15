
"use client";

import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { Project } from './types';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
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
    const [isBootstrapping, setIsBootstrapping] = useState(true);

    const userQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        // Query by doc ID which is the user's UID
        return doc(firestore, "users", user.uid);
    }, [firestore, user]);
    
    // We will use this to get the user's role
    const { data: userDoc, isLoading: userRoleLoading } = useCollection<AppUser>(
        useMemoFirebase(() => {
            if (!firestore || !user) return null;
            return query(collection(firestore, "users"), where("email", "==", user.email));
        }, [firestore, user])
    );

     useEffect(() => {
        if (userDoc && userDoc.length > 0) {
            setIsAdmin(userDoc[0].role === 'admin');
        } else {
            setIsAdmin(false);
        }
    }, [userDoc]);


    // Bootstrap function to make the first logged-in user an admin if no admin exists
    useEffect(() => {
        const bootstrapAdmin = async () => {
            if (!firestore || !user || userRoleLoading) return;

            try {
                // Check if any admin user exists
                const adminQuery = query(collection(firestore, "users"), where("role", "==", "admin"));
                const adminSnapshot = await getDocs(adminQuery);

                // If no admin exists, make the current user an admin
                if (adminSnapshot.empty) {
                    console.log("No admins found. Making current user admin.");
                    
                    const userRef = doc(firestore, 'users_by_email', user.email!);
                    const userDocSnap = await getDoc(userRef);

                    // A user might exist in users_by_email but not in users collection yet
                    // Or they might not exist at all.
                    // We ensure they are created with admin role.
                    if (!userDocSnap.exists()) {
                         await setDoc(userRef, { email: user.email });
                    }
                   
                    const userRecordRef = doc(firestore, 'users', user.uid);
                    await setDoc(userRecordRef, { email: user.email, role: 'admin' }, { merge: true });

                    setIsAdmin(true); // Immediately update the state
                    toast({ title: "Admin Yetkisi Verildi", description: `${user.email} artık bir admin.`});
                }
            } catch (error) {
                console.error("Error bootstrapping admin:", error);
            } finally {
                setIsBootstrapping(false);
            }
        };

        if(user) {
            bootstrapAdmin();
        } else if (!userLoading) {
            setIsBootstrapping(false);
        }
    }, [firestore, user, userLoading, toast]);


    const projectsQuery = useMemoFirebase(() => {
        if (!firestore || !user || isBootstrapping) return null;
        if (isAdmin) {
             // Admin sees all projects
            return collection(firestore, "projects");
        }
        // Regular user sees only their projects
        return query(collection(firestore, "projects"), where("ownerId", "==", user.uid));
    }, [firestore, user, isAdmin, isBootstrapping]);
    
    const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

    const loading = userLoading || projectsLoading || userRoleLoading || isBootstrapping;

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

                const selectedProjectData = projects.find(p => p.id === storedId);
                const isOwner = selectedProjectData?.ownerId === user?.uid;

                if (storedId && projectExists && (isAdmin || isOwner)) {
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
    
    if (!loading && selectedProject && !isAdmin && selectedProject.ownerId !== user?.uid) {
        return (
            <ProjectContext.Provider value={{
                projects: null,
                selectedProject: null,
                loading: true,
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
