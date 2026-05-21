# 🚀 AI-Driven Tech Interview Platform

一个基于现代化 Web 架构构建的下一代 AI 模拟面试与招聘平台。结合了大语言模型（LLM）的推理能力与 RAG 思想，为候选人提供千人千面的硬核技术面体验。

## ✨ 核心亮点 (Features)
* **🤖 定制化 AI 面试官**: 接入 Gemini 2.5 Flash 核心，支持根据用户填写的**真实简历与技术栈**（微型 RAG 架构）进行深度定向提问。
* **💻 沉浸式代码交互**: 对话框深度集成 `react-markdown` 与语法高亮，完美渲染后端算法与前端 UI 代码片段。
* **🔐 企业级安全认证**: 采用 Supabase Auth 驱动，完整打通 GitHub & LinkedIn OAuth 第三方 OAuth 登录闭环。
* **📊 成绩单与数据持久化**: 面试结束后自动打包对话记录，通过 Row Level Security (RLS) 策略安全存入云端数据库并在 Dashboard 实时生成历史报告。

## 🛠️ 技术栈 (Tech Stack)
* **前端框架**: React 18 + Vite
* **UI 组件库**: Tailwind CSS + Shadcn UI
* **后端与数据库**: Supabase (PostgreSQL)
* **大语言模型**: Google Generative AI (Gemini API)
* **云端部署**: Vercel

## 🚀 快速启动 (Quick Start)

1. 克隆项目到本地
\`\`\`bash
git clone https://github.com/jingyikcheah-hub/ai-interview-platform.git
\`\`\`

2. 安装依赖
\`\`\`bash
npm install
\`\`\`

3. 配置环境变量 (请在根目录创建 `.env.local` 文件并填入你的 Key)
\`\`\`env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
\`\`\`

4. 启动开发服务器
\`\`\`bash
npm run dev
\`\`\`

## 📄 开源协议 (License)
本项目基于 [MIT License](LICENSE) 开源。
