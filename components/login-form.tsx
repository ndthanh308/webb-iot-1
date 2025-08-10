// "use client"

// import type React from "react"

// import { useState } from "react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Cat } from "lucide-react"

// interface LoginFormProps {
//   onLogin: (email: string, password: string) => boolean
// }

// export default function LoginForm({ onLogin }: LoginFormProps) {
//   const [email, setEmail] = useState("")
//   const [password, setPassword] = useState("")
//   const [error, setError] = useState("")

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault()
//     setError("")

//     const success = onLogin(email, password)
//     if (!success) {
//       setError("Tài khoản hoặc mật khẩu không đúng")
//     }
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
//       <div className="w-full max-w-md">
//         <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8">
//           {/* Logo and Title */}
//           <div className="text-center mb-8">
//             <div className="flex items-center justify-center mb-4">
//               <Cat className="w-8 h-8 text-white mr-2" />
//               <h1 className="text-2xl font-bold text-white">CatCare</h1>
//             </div>
//             <h2 className="text-xl font-semibold text-white mb-2">Đăng nhập</h2>
//           </div>

//           <form onSubmit={handleSubmit} className="space-y-6">
//             <div>
//               <Label htmlFor="email" className="text-gray-300 text-sm font-medium">
//                 Tài khoản
//               </Label>
//               <Input
//                 id="email"
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 placeholder="your@gmail.com"
//                 className="mt-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
//                 required
//               />
//             </div>

//             <div>
//               <Label htmlFor="password" className="text-gray-300 text-sm font-medium">
//                 Mật khẩu
//               </Label>
//               <Input
//                 id="password"
//                 type="password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 placeholder="Nhập mật khẩu"
//                 className="mt-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
//                 required
//               />
//             </div>

//             {error && <div className="text-red-400 text-sm text-center">{error}</div>}

//             <div className="text-center">
//               <a href="#" className="text-sm text-gray-400 hover:text-purple-400">
//                 Quên mật khẩu ?
//               </a>
//             </div>

//             <Button
//               type="submit"
//               className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg"
//             >
//               Đăng nhập
//             </Button>

//             <div className="text-center text-sm text-gray-400">
//               Chưa có tài khoản?{" "}
//               <a href="#" className="text-purple-400 hover:text-purple-300">
//                 Đăng ký ngay
//               </a>
//             </div>
//           </form>

//           {/* Test Account Info */}
//           <div className="mt-6 p-3 bg-gray-700 rounded-lg">
//             <p className="text-xs text-gray-300 text-center">Test Account: uuu@gmail.com / 123456</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Cat, Eye, EyeOff } from "lucide-react"

interface LoginFormProps {
  onLogin: (email: string, password: string) => boolean
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")

  const validateEmail = useCallback((email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) return "Email không được để trống"
    if (!emailRegex.test(email)) return "Email không hợp lệ"
    return ""
  }, [])

  const validatePassword = useCallback((password: string) => {
    if (!password) return "Mật khẩu không được để trống"
    if (password.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự"
    return ""
  }, [])

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    setEmailError(validateEmail(value))
    setError("")
  }, [validateEmail])

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)
    setPasswordError(validatePassword(value))
    setError("")
  }, [validatePassword])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate inputs
    const emailErr = validateEmail(email)
    const passwordErr = validatePassword(password)
    
    setEmailError(emailErr)
    setPasswordError(passwordErr)
    
    if (emailErr || passwordErr) return

    setIsLoading(true)
    setError("")

    // Simulate loading time for realistic feel
    setTimeout(() => {
      const success = onLogin(email, password)
      if (!success) {
        setError("Tài khoản hoặc mật khẩu không đúng. Vui lòng thử lại.")
      }
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Cat className="w-8 h-8 text-white mr-2" />
              <h1 className="text-2xl font-bold text-white">CatCare</h1>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Đăng nhập</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-gray-300 text-sm font-medium">
                Tài khoản
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="your@gmail.com"
                className={`mt-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 ${
                  emailError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                }`}
                required
                disabled={isLoading}
              />
              {emailError && <p className="text-red-400 text-xs mt-1">{emailError}</p>}
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-300 text-sm font-medium">
                Mật khẩu
              </Label>
              <div className="relative mt-2">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Nhập mật khẩu"
                  className={`bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 pr-10 ${
                    passwordError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && <p className="text-red-400 text-xs mt-1">{passwordError}</p>}
            </div>

            {error && <div className="text-red-400 text-sm text-center">{error}</div>}

            <div className="text-center">
              <a href="#" className="text-sm text-gray-400 hover:text-purple-400">
                Quên mật khẩu ?
              </a>
            </div>

            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-all duration-200"
              disabled={isLoading || !!emailError || !!passwordError}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang đăng nhập...</span>
                </div>
              ) : (
                "Đăng nhập"
              )}
            </Button>

            <div className="text-center text-sm text-gray-400">
              Chưa có tài khoản?{" "}
              <a href="#" className="text-purple-400 hover:text-purple-300">
                Đăng ký ngay
              </a>
            </div>
          </form>

          {/* Test Account Info */}
          <div className="mt-6 p-3 bg-gray-700 rounded-lg">
            <p className="text-xs text-gray-300 text-center">Test Account: uuu@gmail.com / 123456</p>
          </div>
        </div>
      </div>
    </div>
  )
}
