import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { ProtectedRoute } from './components/Common/ProtectedRoute';
import { Layout } from './components/Common/Layout';
import { LoginPage } from './components/Auth/LoginPage';
import { SignupPage } from './components/Auth/SignupPage';
import { DashboardPage } from './components/Dashboard/DashboardPage';
import { AssignmentsPage } from './components/Assignments/AssignmentsPage';
import { GradesPage } from './components/Grades/GradesPage';
import { ContactsPage } from './components/Contacts/ContactsPage';
import { ResourcesPage } from './components/Resources/ResourcesPage';
import { AdminHome } from './components/Admin/AdminHome';
import { AdminPanel } from './components/Admin/AdminPanel';

export default function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/assignments" element={<AssignmentsPage />} />
            <Route path="/grades/:courseId?" element={<GradesPage />} />
            <Route path="/contacts/:courseId?" element={<ContactsPage />} />
            <Route path="/resources/:courseId?" element={<ResourcesPage />} />
            <Route path="/admin" element={<ProtectedRoute staffOnly><AdminHome /></ProtectedRoute>} />
            <Route path="/admin/:courseId" element={<ProtectedRoute staffOnly><AdminPanel /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </SocketProvider>
    </BrowserRouter>
  );
}
