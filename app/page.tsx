// "use client"

// import { useState } from "react"
// import LoginForm from "@/components/login-form"
// import Dashboard from "@/components/dashboard"
// import Chatbot from "@/components/chatbot" // Import the Chatbot component

// export default function Home() {
//   const [isAuthenticated, setIsAuthenticated] = useState(false)
//   const [user, setUser] = useState<{ email: string; name: string } | null>(null)

//   const handleLogin = (email: string, password: string) => {
//     // Default test account
//     if (email === "uuu@gmail.com" && password === "123456") {
//       setIsAuthenticated(true)
//       setUser({ email, name: "Test User" })
//       return true
//     }
//     return false
//   }

//   const handleLogout = () => {
//     setIsAuthenticated(false)
//     setUser(null)
//   }

//   return (
//     <div className="min-h-screen bg-gray-900">
//       {!isAuthenticated ? <LoginForm onLogin={handleLogin} /> : <Dashboard user={user} onLogout={handleLogout} />}
//       <Chatbot />
//     </div>
//   )
// }


'use client';

import Dashboard from '@/components/dashboard';
import SimpleAuthGuard from '@/components/simple-auth-guard';

export default function Home() {
  return (
    <SimpleAuthGuard>
      <Dashboard />
    </SimpleAuthGuard>
  );
}