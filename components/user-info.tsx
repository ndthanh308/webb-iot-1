'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { simpleAuth, User } from '@/lib/simple-auth';
import { User as UserIcon, LogOut, Shield, Clock } from 'lucide-react';

export default function UserInfo() {
  const user = simpleAuth.getCurrentUser();

  const handleLogout = () => {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
      simpleAuth.logout();
      window.location.reload();
    }
  };

  if (!user) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <p className="text-gray-400 text-center">Chưa đăng nhập</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <UserIcon className="h-5 w-5" />
          Thông tin người dùng
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Username */}
        <div className="flex items-center gap-3">
          <UserIcon className="h-4 w-4 text-gray-400" />
          <div>
            <p className="text-sm text-gray-400">Tên đăng nhập</p>
            <p className="text-white font-medium">{user.username}</p>
          </div>
        </div>

        {/* Role */}
        <div className="flex items-center gap-3">
          <Shield className="h-4 w-4 text-gray-400" />
          <div>
            <p className="text-sm text-gray-400">Vai trò</p>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              user.role === 'admin' 
                ? 'bg-red-900 text-red-300' 
                : 'bg-blue-900 text-blue-300'
            }`}>
              {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
            </span>
          </div>
        </div>

        {/* Created At */}
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-gray-400" />
          <div>
            <p className="text-sm text-gray-400">Ngày tạo</p>
            <p className="text-white text-sm">
              {new Date(user.createdAt).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>

        {/* Last Login */}
        {user.lastLogin && (
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm text-gray-400">Đăng nhập lần cuối</p>
              <p className="text-white text-sm">
                {new Date(user.lastLogin).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
        )}

        {/* Logout Button - Nổi bật hơn */}
        <Button
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white mt-6 shadow-lg"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Đăng xuất
        </Button>
      </CardContent>
    </Card>
  );
}