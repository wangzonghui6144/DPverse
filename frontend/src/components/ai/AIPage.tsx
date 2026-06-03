import { useState, useRef, useEffect, useCallback } from 'react'
import { useAppStore } from '../../stores/appStore'
import { CANCER_LABELS } from '../../types'
import type { ChatMessage } from '../../types'
import { Send, Bot, User, Sparkles, Loader2, Zap } from 'lucide-react'

// Simulated AI responses
const AI_RESPONSES: Record<string, string> = {
  default: '我可以帮您分析泛癌种数据。您可以询问：\n\n• 各癌种通路活性分析\n• 特定基因突变频率\n• MOA药物响应预测\n• 患者群体特征统计\n\n请描述您想了解的具体问题。',

  '通路': '根据当前数据，MAPK通路在**肺腺癌(LUAD)**中活性最高(0.73)，而在**胶质母细胞瘤(GBM)**中PI3K/AKT通路显著激活(0.68)。\n\n建议关注：\n1. EGFR→RAS→MAPK信号轴在肺腺癌中的主导作用\n2. PTEN缺失导致的PI3K通路异常激活\n3. 联合靶向MAPK和PI3K在GBM中的潜在价值',

  '基因': '当前队列中突变频率TOP5基因：\n\n1. **TP53** - 48.3% (抑癌基因)\n2. **KRAS** - 32.1% (癌基因)\n3. **EGFR** - 21.7% (癌基因)\n4. **PIK3CA** - 18.9% (癌基因)\n5. **PTEN** - 15.4% (抑癌基因)\n\nTP53突变在所有癌种中普遍存在，是泛癌种最重要的驱动基因之一。',

  '药物': '基于MOA虚拟试验分析：\n\n**免疫检查点抑制剂(ICI)**：\n- 最高响应率：皮肤黑色素瘤(SKCM) 62.3%\n- 最低响应率：胶质母细胞瘤(GBM) 8.7%\n- 生物标志物：PD-L1阳性患者响应率提升3.2倍\n\n**EGFR靶向治疗**：\n- 最高响应率：肺腺癌(LUAD) 47.5%\n- 与EGFR突变高度相关(Fold=4.1x)',

  '患者': '当前数字孪生患者库概况：\n\n- 总计 **2,000** 名虚拟患者\n- 覆盖 **20+** 癌种\n- 每个患者包含 **5-50** 个基因组突变\n- **500+** 细胞功能指标\n- **500+** 信号通路活性评分\n\n数据基于DAGG算法从真实世界基因组数据转化生成。',
}

function simulateAIResponse(query: string): string {
  const q = query.toLowerCase()
  if (q.includes('通路') || q.includes('pathway') || q.includes('信号')) return AI_RESPONSES['通路']
  if (q.includes('基因') || q.includes('突变') || q.includes('gene')) return AI_RESPONSES['基因']
  if (q.includes('药物') || q.includes('moa') || q.includes('响应') || q.includes('治疗')) return AI_RESPONSES['药物']
  if (q.includes('患者') || q.includes('数据') || q.includes('人数')) return AI_RESPONSES['患者']
  return AI_RESPONSES['default']
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
        ${isUser ? 'bg-primary-500' : 'bg-gradient-to-br from-purple-500 to-pink-500'}`}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed
        ${isUser
          ? 'bg-primary-500 text-white rounded-tr-sm'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm'
        }`}
      >
        <div className="whitespace-pre-wrap">
          {message.content.split('\n').map((line, i) => {
            // Bold markdown
            const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            return <span key={i} dangerouslySetInnerHTML={{ __html: formatted }} />
          })}
        </div>
      </div>
    </div>
  )
}

// Quick question chips
const QUICK_QUESTIONS = [
  { icon: Zap, text: '通路活性分析', query: '分析各癌种通路活性差异' },
  { icon: Dna, text: '基因突变频率', query: '哪些基因突变频率最高？' },
  { icon: Sparkles, text: '药物响应预测', query: '免疫治疗在各癌种的响应率？' },
  { icon: Users, text: '患者库概况', query: '当前患者库的基本数据？' },
]

import { Dna, Users } from 'lucide-react'

export default function AIPage() {
  const selectedCancer = useAppStore((s) => s.selectedCancer)

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 您好！我是DPverse的AI分析助手。\n\n我可以帮助您：\n• 分析**${CANCER_LABELS[selectedCancer]}**及其他癌种的信号通路活性\n• 查询基因突变频率与通路关联\n• 评估不同MOA药物的虚拟试验响应\n• 统计患者群体特征\n\n请提出您的问题，或点击下方的快捷提问。`,
      timestamp: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Simulate AI thinking
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200))

    const aiMsg: ChatMessage = {
      id: `ai_${Date.now()}`,
      role: 'assistant',
      content: simulateAIResponse(text),
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, aiMsg])
    setIsTyping(false)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="space-y-4 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-500" />
          AI分析助手
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          基于DAGG算法数据，提供自然语言交互式分析
        </p>
      </div>

      {/* Chat area */}
      <div className="glass-card overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          {isTyping && (
            <div className="flex items-center gap-2 text-slate-400 text-sm pl-11">
              <Loader2 className="w-4 h-4 animate-spin" />
              AI正在分析...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick questions */}
        {messages.length <= 1 && (
          <div className="px-6 pb-3">
            <p className="text-xs text-slate-400 mb-2">快捷提问：</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q.text}
                  onClick={() => sendMessage(q.query)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium
                           bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400
                           hover:bg-primary-50 dark:hover:bg-primary-950 hover:text-primary-600
                           transition-colors flex items-center gap-1.5"
                >
                  <q.icon className="w-3 h-3" />
                  {q.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-4">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入您的问题..."
              rows={2}
              className="flex-1 px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700
                       bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white
                       resize-none outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              className="px-4 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-40
                       disabled:cursor-not-allowed text-white transition-colors flex items-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
