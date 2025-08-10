'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { simpleAuth } from '@/lib/simple-auth';
import { Eye, EyeOff, User, Lock, Cat } from 'lucide-react';

interface SimpleLoginProps {
  onLoginSuccess: () => void;
}

export default function SimpleLogin({ onLoginSuccess }: SimpleLoginProps) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isRegisterMode) {
        // Đăng ký
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Mật khẩu xác nhận không khớp');
        }
        
        if (formData.password.length < 4) {
          throw new Error('Mật khẩu phải có ít nhất 4 ký tự');
        }

        const role = formData.username.toLowerCase().includes('admin') ? 'admin' : 'user';
        await simpleAuth.register(formData.username, formData.password, role);
        
        // Tự động đăng nhập sau khi đăng ký
        await simpleAuth.login(formData.username, formData.password);
        onLoginSuccess();
      } else {
        // Đăng nhập
        await simpleAuth.login(formData.username, formData.password);
        onLoginSuccess();
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Cat className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            {isRegisterMode ? 'Đăng ký CatCare' : 'Đăng nhập CatCare'}
          </CardTitle>
          <CardDescription className="text-slate-400">
            {isRegisterMode ? 'Tạo tài khoản mới' : 'Nhập thông tin đăng nhập'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white">Tên đăng nhập</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="admin hoặc user123"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10 bg-slate-700 border-slate-600 text-white"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 text-slate-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Confirm Password (chỉ hiện khi đăng ký) */}
            {isRegisterMode && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10 bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-md p-3">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Đang xử lý...' : (isRegisterMode ? 'Đăng ký' : 'Đăng nhập')}
            </Button>

            {/* Switch Mode */}
            <div className="text-center text-slate-400">
              {isRegisterMode ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
              <Button
                type="button"
                variant="link"
                className="text-blue-400 hover:text-blue-300 p-0"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setError('');
                  setFormData({ username: '', password: '', confirmPassword: '' });
                }}
              >
                {isRegisterMode ? 'Đăng nhập ngay' : 'Đăng ký ngay'}
              </Button>
            </div>
          </form>

          {/* Default Accounts Info */}
          <div className="mt-6 p-3 bg-slate-700 rounded-md">
            <p className="text-slate-300 text-sm mb-2">💡 Gợi ý:</p>
            <p className="text-slate-400 text-xs">
              • Username có chữ "admin" → quyền admin<br/>
              • Username khác → quyền user<br/>
              • Mật khẩu tối thiểu 4 ký tự
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}