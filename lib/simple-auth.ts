import {ref, set, get} from 'firebase/database';
import  {database} from './firebase';
import { use } from 'react';
import { snapshot } from 'node:test';



export interface User {
    username: string;
    password: string;
    role: 'admin' | 'user';
    createdAt: number;
    lastLogin?: number;
}


class SimpleAuthService {
    private currentUser: User | null = null;

    async register(username: string, password: string, role: 'admin' | 'user' = 'user'): Promise<boolean>{
        try{
            // Kiểm tra username đã tồn tại chưa
            const userRef = ref(database, `accounts/${username}`);
            const snapshot = await get(userRef);

            if (snapshot.exists()) {
                throw new Error('Tên đăng nhập đã tồn tại');
            }

            // Tạo tài khoản mới
            const newUser: User = {
                username,
                password,
                role,
                createdAt: Date.now()
            };

            await set(userRef, newUser);
            console.log('✅ Đăng ký thành công:', username);
            return true;

        } catch(error) {
            console.error('❌ Đăng ký thất bại:', error);
            throw error;
        }
    }

    async login(username: string, password: string): Promise<User> {
        try {
        const userRef = ref(database, `accounts/${username}`);
        const snapshot = await get(userRef);
        
        if (!snapshot.exists()) {
            throw new Error('Tài khoản không tồn tại');
        }

        const user: User = snapshot.val();
        
        if (user.password !== password) {
            throw new Error('❌ Mật khẩu không chính xác');
        }

        // Cập nhật last login
        await set(ref(database, `accounts/${username}/lastLogin`), Date.now());
        
        // Lưu user vào localStorage
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        console.log('✅ Đăng nhập thành công:', username);
        return user;
        } catch (error) {
        console.error('❌ Đăng nhập thất bại:', error);
        throw error;
        }
    }

    logout(): void {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        console.log('✅ Đăng xuất thành công');
    }

   getCurrentUser(): User | null {
        if (this.currentUser) {
        return this.currentUser;
        }

        // Kiểm tra localStorage
        const stored = localStorage.getItem('currentUser');
        if (stored) {
        try {
            this.currentUser = JSON.parse(stored);
            return this.currentUser;
        } catch {
            localStorage.removeItem('currentUser');
        }
        }

        return null;
    }

    // Kiểm tra đã đăng nhập chưa
    isLoggedIn(): boolean {
        return this.getCurrentUser() !== null;
    }

    // Kiểm tra quyền admin (thừa)
    isAdmin(): boolean {
        const user = this.getCurrentUser();
        return user?.role === 'admin';
    }
}
export const simpleAuth = new SimpleAuthService();
