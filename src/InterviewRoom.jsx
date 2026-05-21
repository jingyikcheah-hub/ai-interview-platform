import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { GoogleGenerativeAI } from "@google/generative-ai"

// 👉 新增：用于解析 Markdown 和代码高亮的库
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ""
const genAI = new GoogleGenerativeAI(apiKey)

export default function InterviewRoom({ onExit }) {
  const [messages, setMessages] = useState([
    { role: "ai", text: "你好！我是你的专属 AI 面试官。准备好开始今天的技术面试了吗？请先做个简短的自我介绍吧。" }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  // 👉 新增：用于自动滚动的“锚点”
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // 每次消息列表更新时，自动滑到底部
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
      // 保持你之前运行成功的模型名
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }) 
      
      const prompt = `你现在是一位严谨但友善的科技公司技术面试官。
      应聘者回答是："${input}"
      请根据应聘者的回答，给出一句专业的评价。如果涉及技术概念，可以适当地用 Markdown 格式输出代码示例或要点。
      最后请顺其自然地提出下一个面试问题。
      注意：请保持对话感，每次只问一个问题。`

      const result = await model.generateContent(prompt)
      const aiMsg = { role: "ai", text: result.response.text() }
      
      setMessages([...newMessages, aiMsg])
    } catch (error) {
      console.error("AI 错误:", error)
      setMessages([...newMessages, { role: "ai", text: "连接异常，请重试。" }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 flex items-center justify-center">
      <Card className="w-full max-w-5xl h-[85vh] flex flex-col shadow-xl border-0 overflow-hidden bg-white">
        
        {/* 顶部栏 */}
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
          <Button variant="ghost" onClick={onExit} className="hover:bg-red-50 hover:text-red-600 transition-colors">
            结束面试
          </Button>
        </CardHeader>
        
        {/* 聊天内容区 */}
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8faff]">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                
                {/* 头像 */}
                <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center text-xs font-bold ${
                  msg.role === "user" ? "bg-slate-700 text-white" : "bg-blue-100 text-blue-600"
                }`}>
                  {msg.role === "user" ? "ME" : "AI"}
                </div>

                {/* 气泡 */}
                <div className={`p-4 rounded-2xl shadow-sm text-[15px] leading-relaxed ${
                  msg.role === "user" 
                  ? "bg-blue-600 text-white rounded-tr-none" 
                  : "bg-white text-slate-800 border border-slate-100 rounded-tl-none"
                }`}>
                  {/* 👉 使用 ReactMarkdown 渲染内容 */}
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({node, inline, className, children, ...props}) {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={oneDark}
                            language={match[1]}
                            PreTag="div"
                            className="rounded-md my-2"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className="bg-slate-200 px-1 rounded text-red-600" {...props}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          
          {/* 等待状态 */}
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
          
          {/* 👉 自动滚动的锚点 */}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* 输入区 */}
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
            <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="lg" className="rounded-xl px-8 shadow-lg shadow-blue-200 transition-all active:scale-95">
              发送
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}