"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, MessageSquare, X, MoreHorizontal } from 'lucide-react'
import { Cat } from 'lucide-react'

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Chào bạn! Chào mừng đến với Mr. Meow. Tôi sẽ hỗ trợ bạn tại đây hôm nay." },
    { role: "assistant", content: "Tôi có thể giúp gì cho bạn hôm nay?" },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (text: string) => {
    if (text.trim() === "") return

    const newMessages: Message[] = [...messages, { role: "user", content: text }]
    setMessages(newMessages)
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      // Changed data.response to data.text to match the API route
      setMessages((prevMessages) => [...prevMessages, { role: "assistant", content: data.response }])
    } catch (error) {
      console.error("Error sending message:", error)
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "assistant", content: "Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau." },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleButtonClick = (text: string) => {
    handleSendMessage(text)
  }

  // Helper function to render message content with basic markdown for bold text
  const renderMessageContent = (content: string) => {
    // Simple regex to convert **text** to <strong>text</strong>
    const htmlContent = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Using dangerouslySetInnerHTML for simple markdown rendering.
    // Be cautious with this in production if content is user-generated and not sanitized.
    return <span dangerouslySetInnerHTML={{ __html: htmlContent }} />;
  };

  return (
    <>
      {!isOpen && (
        <Button
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg"
          onClick={() => setIsOpen(true)}
          aria-label="Mở chatbot"
        >
          <MessageSquare className="w-6 h-6" />
        </Button>
      )}

      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 transition-all duration-300 ${isExpanded ? "w-[90vw] h-[90vh] max-w-3xl" : "w-full max-w-sm h-[500px]"}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-blue-600 text-white p-4 rounded-t-xl drop-shadow-sm"> {/* Changed to bg-blue-600 */}
            <div className="flex items-center">
              <Cat className="w-6 h-6 mr-2" />
              <span className="font-bold">Mr. Meow</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-blue-600"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-label="Phóng to / Thu nhỏ"
              >
                {isExpanded ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 3h6v6M9 21H3v-6M21 15v6h-6M3 9V3h6" /></svg>
                ) : (
                  <MoreHorizontal className="w-5 h-5" />
                )}
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-blue-600" onClick={() => setIsOpen(false)} aria-label="Đóng chatbot">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-neutral-100 text-sm">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex mb-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && <Cat className="w-5 h-5 mr-2 text-gray-700" />} {/* Removed mt-1 for better alignment */}
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl whitespace-pre-wrap shadow-sm ${msg.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-800 border border-gray-200"
                    }`}
                >
                  {renderMessageContent(msg.content)} {/* Use helper function to render content */}
                </div>
                {msg.role === "user" && (
                  <img
                    src="/placeholder.svg?height=20&width=20"
                    alt="Ảnh đại diện người dùng"
                    className="w-5 h-5 rounded-full ml-2 mt-1"
                  />
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <Cat className="w-5 h-5 mr-2 text-gray-700" />
                <div className="max-w-[80%] px-4 py-2 rounded-2xl bg-white text-gray-800 border border-gray-200">
                  <div className="animate-pulse">...</div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Action Buttons */}
          {messages.length <= 2 && input.trim() === "" && (
            <div className="p-4 border-t border-gray-200 bg-white flex flex-wrap gap-2 justify-center">
              <Button
                variant="outline"
                className="rounded-full border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 px-4 py-1.5 text-sm shadow-sm"
                onClick={() => handleButtonClick("Nhiệt độ hiện tại")}
              >
                Nhiệt độ hiện tại
              </Button>
              <Button
                variant="outline"
                className="rounded-full border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 px-4 py-1.5 text-sm shadow-sm"
                onClick={() => handleButtonClick("Độ ẩm hiện tại")}
              >
                Độ ẩm hiện tại
              </Button>
              <Button
                variant="outline"
                className="rounded-full border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 px-4 py-1.5 text-sm shadow-sm"
                onClick={() => handleButtonClick("Số lần mèo chơi")}
              >
                Số lần mèo chơi
              </Button>
            </div>
          )}
          {/* Input */}
          <div className="flex items-center p-4 border-t border-gray-200 bg-white">
            <Input
              type="text"
              placeholder="Nhập tin nhắn của bạn..."
              className="flex-1 mx-2 border-gray-300 rounded-full px-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !isLoading) {
                  handleSendMessage(input)
                }
              }}
              disabled={isLoading}
            />
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2"
              onClick={() => handleSendMessage(input)}
              disabled={isLoading}
              aria-label="Gửi tin nhắn"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-400 p-2 border-t border-gray-100 bg-white">
            Trò chuyện <span className="text-yellow-500">⚡</span> bởi Mr. Meow
          </div>
        </div>
      )}
    </>
  )
}
