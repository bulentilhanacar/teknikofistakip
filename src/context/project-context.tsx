"use client";

import React, { createContext, useState, useContext, useMemo } from 'react';

// Proje ve veri tiplerini tanımlıyoruz
interface Project {
    id: string;
    name: string;
}

const initialProjects: Project[] = [
    { id: "proje-istanbul", name: "İstanbul Ofis Projesi" },
    { id: "proje-ankara", name: "Ankara Konut Projesi" },
];

interface ProjectContextType {
    projects: Project[];
    selectedProject: Project | null;
    selectProject: (projectId: string | null) => void;
    addProject: (projectName: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: React.ReactNode }) => {
    const [projects, setProjects] = useState<Project[]>(initialProjects);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialProjects[0]?.id || null);

    const selectProject = (projectId: string | null) => {
        setSelectedProjectId(projectId);
    };

    const addProject = (projectName: string) => {
        const newProject = {
            id: `proje-${projectName.toLowerCase().replace(/\s/g, '-')}-${projects.length + 1}`,
            name: projectName,
        };
        setProjects(prev => [...prev, newProject]);
        setSelectedProjectId(newProject.id);
    };
    
    const selectedProject = useMemo(() => {
        return projects.find(p => p.id === selectedProjectId) || null;
    }, [selectedProjectId, projects]);

    const value = {
        projects,
        selectedProject,
        selectProject,
        addProject,
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
