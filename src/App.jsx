import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { supabase } from "./lib/supabase"
import InterviewRoom from "./InterviewRoom"

function App() {
  const [user, setUser] = useState(null)
  const [events, setEvents] = useState([])
  const [reports, setReports] = useState([]) // 👉 新增：存放面试报告的箱子
  
  const [isOpen, setIsOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newOrganizer, setNewOrganizer] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isInterviewing, setIsInterviewing] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    fetchEvents()
  }, [])

  // 👉 当用户登录成功时，抓取他的历史面试记录
  useEffect(() => {
    if (user) fetchReports()
  }, [user])

  const fetchEvents = async () => {
    const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false })
    if (!error) setEvents(data)
  }

  // 👉 抓取面试报告的逻辑
  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('interview_reports')
      .select('*')
      .eq('candidate_email', user.email) // 只抓自己的
      .order('created_at', { ascending: false })
    if (!error) setReports(data)
  }

  const handleCreateEvent = async (e) => {
    e.preventDefault()
    if (!newTitle || !newOrganizer || !newDescription) return
    setIsSubmitting(true)
    const { error } = await supabase.from('events').insert([{ title: newTitle, organizer: newOrganizer, description: newDescription }])
    setIsSubmitting(false)
    if (!error) { setIsOpen(false); setNewTitle(""); setNewOrganizer(""); setNewDescription(""); fetchEvents() }
  }

  const handleGithubLogin = async () => { await supabase.auth.signInWithOAuth({ provider: 'github' }) }
  const handleLinkedInLogin = async () => { await supabase.auth.signInWithOAuth({ provider: 'linkedin_oidc' }) }
  const handleLogout = async () => { await supabase.auth.signOut() }

  if (user) {
    if (isInterviewing) {
      // 👉 退出面试间时，重新抓取一次数据，刷新成绩单
      return <InterviewRoom userEmail={user.email} onExit={() => { setIsInterviewing(false); fetchReports(); }} />
    }

    return (
      <div className="min-h-screen bg-muted/30 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-lg shadow-sm border gap-4">
            <div>
              <h1 className="text-2xl font-bold">开发者个人中心</h1>
              <p className="text-muted-foreground text-sm mt-1">{user.email}</p>
            </div>
            <div className="space-x-3">
              <Button onClick={() => setIsInterviewing(true)} className="bg-blue-600 hover:bg-blue-700 shadow-md">进入 AI 面试间</Button>
              <Button variant="outline" onClick={handleLogout}>退出登录</Button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* 左侧：人才市场区占三分之二 */}
            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">人才市场 (Events)</h2>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                  <DialogTrigger asChild><Button variant="secondary" size="sm">发布新活动</Button></DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>发布活动 / 职位</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateEvent} className="space-y-4 mt-4">
                      <div className="space-y-2"><label className="text-sm font-medium">活动标题</label><Input placeholder="标题..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required /></div>
                      <div className="space-y-2"><label className="text-sm font-medium">主办方</label><Input placeholder="公司或组织..." value={newOrganizer} onChange={(e) => setNewOrganizer(e.target.value)} required /></div>
                      <div className="space-y-2"><label className="text-sm font-medium">详情描述</label><Textarea placeholder="详情..." rows={4} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} required /></div>
                      <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "发布中..." : "确认发布"}</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                {events.map((event) => (
                  <Card key={event.id} className="hover:shadow-md transition-shadow bg-white">
                    <CardHeader>
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      <CardDescription className="text-blue-600 font-medium">{event.organizer}</CardDescription>
                    </CardHeader>
                    <CardContent><p className="text-sm text-gray-600 line-clamp-3">{event.description}</p></CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* 👉 右侧：全新的历史面试记录区 */}
            <div>
              <h2 className="text-xl font-bold mb-4">我的面试记录</h2>
              <div className="space-y-4">
                {reports.length === 0 ? (
                  <Card className="bg-white/50 border-dashed"><CardContent className="p-6 text-center text-sm text-muted-foreground">你还没有进行过任何面试。赶紧去试试吧！</CardContent></Card>
                ) : (
                  reports.map((report) => (
                    <Card key={report.id} className="bg-white border-l-4 border-l-blue-500">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">AI 技术面试</CardTitle>
                        <CardDescription className="text-xs">
                          {new Date(report.created_at).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-xs text-gray-500 bg-slate-50 p-2 rounded-md border">
                          对话回合数: {report.chat_history.filter(m => m.role === 'user').length}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <Card className="w-[400px] shadow-2xl border-0">
        <CardHeader className="text-center pt-8 pb-4">
          <CardTitle className="text-3xl font-bold text-slate-800">登入平台</CardTitle>
          <CardDescription className="mt-2 text-base">AI 驱动的下一代人才招聘网络</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-8">
          <Button className="w-full bg-[#24292F] hover:bg-[#24292F]/90 text-white shadow-md py-6 text-base" onClick={handleGithubLogin}>
            <i className="fa-brands fa-github mr-2 text-xl"></i> 使用 GitHub 登录
          </Button>
          <Button className="w-full bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white shadow-md py-6 text-base" onClick={handleLinkedInLogin}>
            <i className="fa-brands fa-linkedin mr-2 text-xl"></i> 使用 LinkedIn 登录
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default App