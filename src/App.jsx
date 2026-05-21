import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { supabase } from "./lib/supabase"

// 👉 引入我们刚刚写好的面试间组件！
import InterviewRoom from "./InterviewRoom"

function App() {
  const [user, setUser] = useState(null)
  const [events, setEvents] = useState([])
  
  const [isOpen, setIsOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newOrganizer, setNewOrganizer] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 👉 新增魔法：控制用户现在是否在面试房间里的状态
  const [isInterviewing, setIsInterviewing] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    fetchEvents()
    return () => subscription.unsubscribe()
  }, [])

  const fetchEvents = async () => {
    const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false })
    if (!error) setEvents(data)
  }

  const handleCreateEvent = async (e) => {
    e.preventDefault()
    if (!newTitle || !newOrganizer || !newDescription) return
    setIsSubmitting(true)
    const { error } = await supabase.from('events').insert([{ title: newTitle, organizer: newOrganizer, description: newDescription }])
    setIsSubmitting(false)
    if (error) {
      console.error("发布失败:", error.message)
      alert("发布失败，请检查控制台。")
    } else {
      setIsOpen(false); setNewTitle(""); setNewOrganizer(""); setNewDescription(""); fetchEvents()
    }
  }

  const handleGithubLogin = async () => { await supabase.auth.signInWithOAuth({ provider: 'github' }) }
  const handleLinkedInLogin = async () => { await supabase.auth.signInWithOAuth({ provider: 'linkedin_oidc' }) }
  const handleLogout = async () => { await supabase.auth.signOut() }

  if (user) {
    // 👉 如果 isInterviewing 是 true，直接全屏渲染面试间组件，隐藏后台！
    if (isInterviewing) {
      return <InterviewRoom onExit={() => setIsInterviewing(false)} />
    }

    // 否则，正常显示人才市场 Dashboard
    return (
      <div className="min-h-screen bg-muted/30 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border">
            <div>
              <h1 className="text-2xl font-bold">开发者个人中心</h1>
              <p className="text-muted-foreground text-sm mt-1">{user.email}</p>
            </div>
            <div className="space-x-3">
              {/* 👉 新增：进入面试间的帅气按钮 */}
              <Button onClick={() => setIsInterviewing(true)} className="bg-blue-600 hover:bg-blue-700">进入 AI 面试间</Button>
              <Button variant="outline" onClick={handleLogout}>退出登录</Button>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Event Marketplace</h2>
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild><Button variant="secondary">发布新活动</Button></DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>发布活动 / 职位</DialogTitle>
                    <DialogDescription>填写下方信息，发布后将立即展示在人才市场中。</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateEvent} className="space-y-4 mt-4">
                    <div className="space-y-2"><label className="text-sm font-medium">活动标题</label><Input placeholder="例如：2026 软件工程师秋季招聘" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required /></div>
                    <div className="space-y-2"><label className="text-sm font-medium">主办方 / 公司</label><Input placeholder="例如：UTAR 或 Google" value={newOrganizer} onChange={(e) => setNewOrganizer(e.target.value)} required /></div>
                    <div className="space-y-2"><label className="text-sm font-medium">详情描述</label><Textarea placeholder="请输入职位要求或活动详情..." rows={4} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} required /></div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "发布中..." : "确认发布"}</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {events.map((event) => (
                <Card key={event.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <CardDescription className="text-blue-600 font-medium">{event.organizer}</CardDescription>
                  </CardHeader>
                  <CardContent><p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{event.description}</p></CardContent>
                </Card>
              ))}
            </div>
            {events.length === 0 && <p className="text-center text-muted-foreground mt-8">目前市场里还没有活动发布哦...</p>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center bg-muted/30">
      <Card className="w-[400px] shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">欢迎使用</CardTitle>
          <CardDescription>AI 驱动的下一代人才招聘与面试平台</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button className="w-full bg-[#24292F] hover:bg-[#24292F]/90 text-white" size="lg" onClick={handleGithubLogin}>使用 GitHub 账号登录</Button>
          <Button className="w-full bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white" size="lg" onClick={handleLinkedInLogin}>使用 LinkedIn 账号登录</Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default App