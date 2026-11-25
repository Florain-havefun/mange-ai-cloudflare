import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight, Check, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "如何获取 Session · 满格 AI",
  description: "在 ChatGPT 官网获取自己的 Session，在浏览器本地读取账号邮箱。",
};

export default function SessionGuide() {
  return <>
    <header className="site-header">
      <div className="container nav-wrap">
        <a className="brand" href="/" aria-label="满格 AI 首页"><img src="/favicon.svg" width="35" height="35" alt="" /><span>满格<span className="brand-ai">AI</span></span></a>
        <a className="query-button" href="/#plans"><ArrowLeft size={15} />返回套餐</a>
      </div>
    </header>
    <main className="session-guide container">
      <span className="section-index">MANGE AI / SESSION GUIDE</span>
      <h1>如何获取 <span className="serif">Session</span></h1>
      <p className="session-guide-intro">在已登录 ChatGPT 的同一个浏览器中完成以下两步。</p>
      <ol className="session-guide-steps">
        <li>
          <span className="guide-step-index">1</span>
          <div><h2>在官网 <a href="https://chatgpt.com/" target="_blank" rel="noreferrer">www.chatgpt.com<ArrowUpRight size={18} /></a> 登录</h2>
            <p>登录你自己的 ChatGPT 账号，确认账号邮箱与要填写的订单一致。</p>
            <a className="button primary" href="https://chatgpt.com/" target="_blank" rel="noreferrer">打开 ChatGPT 官网<ArrowUpRight size={17} /></a>
          </div>
        </li>
        <li>
          <span className="guide-step-index">2</span>
          <div><h2>在浏览器打开下面网站，复制全部代码输入</h2>
            <a className="session-url" href="https://chatgpt.com/api/auth/session" target="_blank" rel="noreferrer"><code>https://chatgpt.com/api/auth/session</code><ArrowUpRight size={18} /></a>
            <p>复制页面显示的完整 JSON 内容，切回原来的订单标签页，粘贴到「填写 Session」，点击「本地解析 Session」。</p>
            <span className="guide-result"><Check size={16} />解析成功后读取账号邮箱用于订单登记，并清空 Session 原文。</span>
          </div>
        </li>
      </ol>
      <aside className="session-guide-privacy"><ShieldCheck size={23} /><div><h2>仅在你的浏览器本地解析</h2><p>完整 Session 含有账号登录凭证，请勿公开分享或发送给他人。本网站只读取邮箱，不上传或保存 Session、accessToken、sessionToken 或 Cookie，也不会使用它自动登录账号。</p><p>订单中的账号邮箱会从 Session 中读取，无需手动填写。</p></div></aside>
      <p className="session-guide-tip">如果页面显示空对象 <code>{"{}"}</code> 或提示未登录，请先在同一浏览器完成第 1 步，再重新打开第 2 步的链接。</p>
      <a className="text-link" href="/#plans"><ArrowLeft size={16} />返回订阅套餐</a>
    </main>
    <footer className="container session-guide-footer">满格 AI · 独立订阅协助服务，与 OpenAI 无隶属关系</footer>
  </>;
}
