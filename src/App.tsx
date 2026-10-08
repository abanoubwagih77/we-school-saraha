/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SystemSettings } from './types';
import { fetchSettings, verifyAdmin, adminLogout, fetchAdminStats } from './services/api';
import { Header } from './components/Header';
import { StudentView } from './components/StudentView';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginModal } from './components/AdminLoginModal';
import { Footer } from './components/Footer';

export default function App() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewMode, setViewMode] = useState<'student' | 'admin'>('student');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load School Settings & Check Admin Session
  const initApp = async () => {
    try {
      const s = await fetchSettings();
      setSettings(s);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }

    try {
      const verified = await verifyAdmin();
      setIsAdmin(verified);
      if (verified) {
        // If already logged in, check unread count
        fetchAdminStats()
          .then((st) => setUnreadCount(st.unread))
          .catch(() => {});
      }
    } catch {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    initApp();
  }, []);

  // Poll unread count if admin
  useEffect(() => {
    if (!isAdmin) return;
    const updateStats = () => {
      fetchAdminStats()
        .then((st) => setUnreadCount(st.unread))
        .catch(() => {});
    };
    updateStats();
    const interval = setInterval(updateStats, 30000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const handleLoginSuccess = () => {
    setIsAdmin(true);
    setViewMode('admin');
    fetchAdminStats()
      .then((st) => setUnreadCount(st.unread))
      .catch(() => {});
  };

  const handleLogout = async () => {
    await adminLogout();
    setIsAdmin(false);
    setViewMode('student');
    setUnreadCount(0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-['Cairo',sans-serif]">
      {/* Universal Header */}
      <Header
        settings={settings}
        isAdmin={isAdmin}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        unreadCount={unreadCount}
      />

      {/* Main Body */}
      <main className="flex-1">
        {viewMode === 'admin' && isAdmin ? (
          <AdminDashboard
            settings={settings}
            onRefreshSettings={initApp}
            onOpenStudentView={() => setViewMode('student')}
          />
        ) : (
          <StudentView settings={settings} />
        )}
      </main>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Universal Footer with Engineer Credits */}
      <Footer />
    </div>
  );
}
