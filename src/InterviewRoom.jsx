import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
// 引入 Google 官方的 AI 工具
import { GoogleGenerativeAI } from "@google/generative-ai"

// 读取你的环境钥匙并唤醒 AI 引擎
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ""
const genAI = new GoogleGenerativeAI(apiKey)

export default function InterviewRoom({ onExit }) {
  // 记录聊天历史的箱子
  const [messages, setMessages] = useState([
    { role: "ai", text: "你好！我是你的专属 AI 面试官。准备好开始今天的技术面试了吗？请先做个简短的自我介绍吧。" }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // 点击发送按钮时触发的魔法
  const handleSend = async () => {
    if (!input.trim()) return
    
    // 1. 把用户的输入显示在界面上
    const userMsg = { role: "user", text: input }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")
    setIsLoading(true)

    try {
      // 2. 召唤目前速度极快的主力模型 gemini-1.5-flash
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }) 
      
      // 3. 核心 Prompt（提示词工程）：赋予 AI 灵魂
      // 我们把刚才的历史对话和新输入打包告诉 AI
      const prompt = `你现在是一位严谨但友善的科技公司技术面试官。
      应聘者刚刚说的话是："${input}"
      请根据应聘者的回答，给出一句专业的评价，并顺其自然地提出下一个面试问题。
      注意：请保持对话感，每次只问一个问题，不要长篇大论。`

      const result = await model.generateContent(prompt)
      const aiMsg = { role: "ai", text: result.response.text() }
      
      // 4. 把 AI 的回复打印到屏幕上
      setMessages([...newMessages, aiMsg])
    } catch (error) {
      console.error("AI 连接错误:", error)
      setMessages([...newMessages, { role: "ai", text: "哎呀，我的大脑好像断线了，请检查终端或者 API 钥匙是否正确！" }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 p-8 flex items-center justify-center">
      <Card className="w-full max-w-4xl h-[700px] flex flex-col shadow-2xl border-0">
        <CardHeader className="border-b bg-white rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold text-blue-600">AI 虚拟面试间</CardTitle>
              <CardDescription>底层驱动引擎: Gemini 2.5 Flash</CardDescription>
            </div>
            <Button variant="destructive" onClick={onExit}>结束面试</Button>
          </div>
        </CardHeader>
        
        {/* 对话展示区 */}
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] p-4 rounded-xl text-sm leading-relaxed shadow-sm ${
                msg.role === "user" 
                ? "bg-blue-600 text-white rounded-tr-none" 
                : "bg-white text-gray-800 border rounded-tl-none"
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border p-4 rounded-xl rounded-tl-none animate-pulse text-sm text-gray-500 shadow-sm">
                面试官正在思考追问策略...
              </div>
            </div>
          )}
        </CardContent>

        {/* 底部输入区 */}
        <div className="p-4 border-t bg-white rounded-b-xl flex gap-3 items-center">
          <Input 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()} // 支持回车发送
            placeholder="输入你的回答..." 
            className="flex-1 text-base p-6"
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="lg" className="px-8 font-bold">
            发送回复
          </Button>
        </div>
      </Card>
    </div>
  )
}