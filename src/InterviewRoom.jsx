import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { GoogleGenerativeAI } from "@google/generative-ai"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

// 👉 引入 Supabase 用于保存数据
import { supabase } from "./lib/supabase"

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ""
const genAI = new GoogleGenerativeAI(apiKey)

// 👉 接收外面传进来的 userEmail
export default function InterviewRoom({ onExit, userEmail, resumeContext }) {
  const [messages, setMessages] = useState([
    { role: "ai", text: "你好！我是你的专属 AI 面试官。准备好开始今天的技术面试了吗？请先做个简短的自我介绍吧。" }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false) // 👉 新增：保存状态指示器
  
  const messagesEndRef = useRef(null)
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const handleSend = async () => {
    if (!input.trim()) return
    
    const userMsg = { role: "user", text: input }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")
    setIsLoading(true)

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }) 
      const prompt = `你现在是一位严谨但友善的科技公司技术面试官。
应聘者的当前回答是："${input}"

${resumeContext ? `【重要背景信息】：应聘者提供了以下简历/技术栈说明：“${resumeContext}”。请务必仔细阅读。` : ''}

【你的任务】：
1. 简短地对用户的回答给出专业反馈。
2. 提出下一个面试问题。
3. 如果有简历背景信息，你的提问必须尽量围绕简历中提到的技术栈、项目经验或学生背景来展开，进行深度挖掘。如果没有简历信息，则问通用的前端/后端技术题。
4. 每次只能问一个问题，保持自然流畅的对话感，切忌像机器一样死板。涉及代码时可以使用 Markdown。`

      const result = await model.generateContent(prompt)
      setMessages([...newMessages, { role: "ai", text: result.response.text() }])
    } catch (error) {
      console.error("AI 错误:", error)
      setMessages([...newMessages, { role: "ai", text: "连接异常，请重试。" }])
    } finally {
      setIsLoading(false)
    }
  }

  // 👉 核心逻辑：结束并保存面试记录
  const handleEndInterview = async () => {
    if (messages.length <= 1) {
      onExit() // 如果还没开始聊，直接退出，不保存垃圾数据
      return
    }

    setIsSaving(true)
    const { error } = await supabase.from('interview_reports').insert([{
      candidate_email: userEmail,
      chat_history: messages
    }])
    setIsSaving(false)

    if (error) {
      console.error("保存失败:", error)
      alert("报告保存失败，请检查控制台。")
    } else {
      onExit() // 存档成功，优雅退出
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 flex items-center justify-center">
      <Card className="w-full max-w-5xl h-[85vh] flex flex-col shadow-xl border-0 overflow-hidden bg-white">
        
        <CardHeader className="border-b bg-white px-6 py-4 flex flex-row justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
              <i className="fa-solid fa-robot text-xl"></i>
            </div>
            <div>
              <CardTitle className="text-xl font-bold">AI 面试官</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Gemini 2.5 Flash 驱动
              </CardDescription>
            </div>
          </div>
          {/* 👉 替换原来的退出按钮，绑定保存逻辑 */}
          <Button variant="ghost" onClick={handleEndInterview} disabled={isSaving} className="hover:bg-red-50 hover:text-red-600 transition-colors">
            {isSaving ? "正在生成报告..." : "结束并保存面试"}
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8faff]">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center text-xs font-bold ${msg.role === "user" ? "bg-slate-700 text-white" : "bg-blue-100 text-blue-600"}`}>
                  {msg.role === "user" ? "ME" : "AI"}
                </div>
                <div className={`p-4 rounded-2xl shadow-sm text-[15px] leading-relaxed ${msg.role === "user" ? "bg-blue-600 text-white rounded-tr-none" : "bg-white text-slate-800 border border-slate-100 rounded-tl-none"}`}>
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({node, inline, className, children, ...props}) {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline && match ? (
                          <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" className="rounded-md my-2" {...props}>
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (<code className="bg-slate-200 px-1 rounded text-red-600" {...props}>{children}</code>)
                      }
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start items-center gap-2 text-slate-400 text-sm italic ml-11">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
              面试官正在思考...
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        <div className="p-6 border-t bg-white shrink-0">
          <div className="max-w-4xl mx-auto flex gap-3">
            <Input 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="输入你的回答，按回车发送..." 
              className="flex-1 py-6 px-4 text-base rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all"
              disabled={isLoading}
            />
            <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="lg" className="rounded-xl px-8 shadow-lg shadow-blue-200 transition-all active:scale-95">发送</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}