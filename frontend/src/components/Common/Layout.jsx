import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const Layout = () => (
  <div className="min-h-screen bg-gray-100">
    <Navbar />
    <main className="max-w-7xl mx-auto p-4 md:p-8">
      <Outlet />
    </main>
  </div>
);
