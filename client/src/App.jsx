import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import KanbanBoard from './components/kanban/KanbanBoard';
import Dashboard from './components/dashboard/Dashboard';
import ProjectList from './components/projects/ProjectList';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import TaskModal from './components/tasks/TaskModal';
import CreateTaskModal from './components/tasks/CreateTaskModal';
import CreateProjectModal from './components/projects/CreateProjectModal';
import AISummaryModal from './components/ai/AISummaryModal';
import api from './services/api';

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'

  // Application State
  const [activeTab, setActiveTab] = useState('kanban'); // 'kanban', 'dashboard', 'projects'
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [users, setUsers] = useState([]);

  // Modals state
  const [selectedTask, setSelectedTask] = useState(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isAISummaryOpen, setIsAISummaryOpen] = useState(false);

  // Fetch projects and users
  const fetchInitialData = async () => {
    try {
      const [projRes, usersRes] = await Promise.all([
        api.get('/projects'),
        api.get('/auth/users'),
      ]);

      if (projRes.data.success) {
        setProjects(projRes.data.data);
        if (projRes.data.data.length > 0 && !selectedProject) {
          setSelectedProject(projRes.data.data[0]);
        }
      }

      if (usersRes.data.success) {
        setUsers(usersRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchInitialData();
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Initializing TeamFlow...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return authView === 'login' ? (
      <Login onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <Register onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  const handleSelectProject = (project, targetTab = 'kanban') => {
    setSelectedProject(project);
    setActiveTab(targetTab);
  };

  const handleProjectCreated = (newProject) => {
    setProjects((prev) => [newProject, ...prev]);
    setSelectedProject(newProject);
    setActiveTab('kanban');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <Navbar
        onOpenAIModal={() => setIsAISummaryOpen(true)}
        currentProject={selectedProject}
      />

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          projects={projects}
          selectedProject={selectedProject}
          setSelectedProject={setSelectedProject}
          onOpenNewProjectModal={() => setIsCreateProjectOpen(true)}
        />

        {/* Tab View */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'kanban' && (
            <KanbanBoard
              project={selectedProject}
              onSelectTask={setSelectedTask}
              onOpenCreateTaskModal={() => setIsCreateTaskOpen(true)}
            />
          )}

          {activeTab === 'dashboard' && (
            <Dashboard
              project={selectedProject}
              onOpenAIModal={() => setIsAISummaryOpen(true)}
              onSelectTask={setSelectedTask}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectList
              projects={projects}
              onSelectProject={handleSelectProject}
              onOpenCreateProject={() => setIsCreateProjectOpen(true)}
              onOpenAIModal={() => setIsAISummaryOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          users={users}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={(updated) => {
            setSelectedTask(null);
            fetchInitialData();
          }}
          onTaskDeleted={() => {
            setSelectedTask(null);
            fetchInitialData();
          }}
        />
      )}

      {isCreateTaskOpen && selectedProject && (
        <CreateTaskModal
          project={selectedProject}
          users={users}
          onClose={() => setIsCreateTaskOpen(false)}
          onTaskCreated={() => {
            setIsCreateTaskOpen(false);
            fetchInitialData();
          }}
        />
      )}

      {isCreateProjectOpen && (
        <CreateProjectModal
          users={users}
          onClose={() => setIsCreateProjectOpen(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}

      {isAISummaryOpen && selectedProject && (
        <AISummaryModal
          project={selectedProject}
          onClose={() => setIsAISummaryOpen(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}
