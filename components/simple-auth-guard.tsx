'use client';

import React, { useState, useEffect } from 'react';
import { simpleAuth, User } from '@/lib/simple-auth';
import SimpleLogin from './simple-login';
import { Cat, Loader2 } from 'lucide-react';

interface SimpleAuthGuardProps {
  children: React.ReactNode;
}

export default function SimpleAuthGuard({ children }: SimpleAuthGuardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra user từ localStorage
    const currentUser = simpleAuth.getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    const currentUser = simpleAuth.getCurrentUser();
    setUser(currentUser);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Cat className="h-12 w-12 text-blue-400 animate-pulse" />
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          <p className="text-white text-lg">Đang tải hệ thống...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <SimpleLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return <>{children}</>;
}