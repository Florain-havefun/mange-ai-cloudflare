"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, ArrowRight, Check, X, Menu, Search, ShieldCheck, FileCheck2, Copy, Download, LoaderCircle, CircleHelp, Sparkles, Zap, Layers3 } from "lucide-react";
import { plans, type Plan } from "@/lib/catalog";
import { parseSessionInfo } from "@/lib/session-info";

type Order = { id: string; planName: string; quantity: number; unitPrice: number | null; total: number | null; email: string; status: string; createdAt: string; preview: boolean };
type Modal = "order" | "lookup" | "privacy" | "terms" | "support" | null;
const money = (value: number) => value.toLocaleString("zh-CN");
const faqs = [
  ["这是 OpenAI 官方网站吗？", "满格 AI 是独立的订阅协助服务，与 OpenAI 无隶属关系。套餐名称用于说明服务对象。你也可以通过 ChatGPT 官方网站自行订阅。"],
  ["我该选 Go、Plus，还是 Pro？", "日常对话和轻度使用可以先了解 Go；经常写作、学习或研究可以考虑 Plus；更高强度的专业工作可以咨询 Pro。各档位功能、额度和可用地区会调整，请以 OpenAI 当时公布的内容为准。"],
  ["Session 会上传或保存吗？", "Session 输入仅在你的浏览器中解析账号邮箱，解析完成后清空原文。订单提交邮箱、套餐和售后联系方式，不上传或保存 Session、accessToken、sessionToken 或 Cookie。也可以直接填写邮箱。"],
  ["现在可以直接付款吗？", "当前为预览版，可创建和查询测试订单，尚未接入在线支付，也不会产生实际扣款。所有订单初始状态均为待确认，创建订单不代表付款、订阅成功或已开始履约。"],
  ["多久开通？退款怎么处理？", "实际开通时间、适用条件、售后与退款规则需要在报价及付款前确认。本站当前不承诺固定到账时间，也未开放付款。确认完整服务条件后再决定是否购买。"],
  ["怎样查看订单进度？", "提交成功后请保存订单号和查询密钥，再通过右上角「订单查询」查看。密钥只在创建时完整显示，系统不通过公开的邮箱搜索订单；请妥善保存查询凭证。"],
];

function Mark({ small = false }: { small?: boolean }) {
  return <span className={`brand-mark ${small ? "small" : ""}`} aria-hidden="true"><i /><i /><i /></span>;
}

function OrderSummary({ order }: { order: Order }) {
  const statusLabels: Record<string, string> = { pending_confirmation: "待确认", awaiting_payment: "待付款", paid: "已付款", processing: "处理中", completed: "已完成", cancelled: "已取消", refunded: "已退款" };
  return <div className="order-detail">
    <div className="order-status"><span className="status-dot" />{statusLabels[order.status] || "待确认"}<span>预览订单</span></div>
    <h3>{order.planName}</h3>
    <dl><div><dt>订单号</dt><dd className="mono">{order.id}</dd></div><div><dt>账号邮箱</dt><dd>{order.email}</dd></div><div><dt>数量</dt><dd>{order.quantity} {order.quantity > 1 ? "席位" : "份"}</dd></div><div><dt>订单金额</dt><dd>{order.total === null ? "待报价" : `¥${money(order.total)} / 月`}</dd></div><div><dt>创建时间</dt><dd>{new Date(order.createdAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false })}</dd></div></dl>
    <p className="note"><CircleHelp size={16} />当前未开放收款。订单创建不代表付款或开通成功。</p>
  </div>;
}

export default function Storefront() {
  const [mobileNav, setMobileNav] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [selected, setSelected] = useState(plans[1]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [lookupResult, setLookupResult] = useState<Order | null>(null);
  const [lookupId, setLookupId] = useState("");
  const [lookupKey, setLookupKey] = useState("");
  const [credential, setCredential] = useState({ requestId: "", lookupKey: "" });
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [contactType, setContactType] = useState<"wechat" | "phone">("wechat");
  const [sessionEmail, setSessionEmail] = useState("");
  const [sessionError, setSessionError] = useState("");
  const sessionInput = useRef<HTMLTextAreaElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const submitting = useRef(false);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (modal && !el.open) el.showModal();
    if (!modal && el.open) el.close();
    document.body.style.overflow = modal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [modal]);

  function openModal(next: Modal) {
    setError(""); setCopied(false); setMobileNav(false); setModal(next);
    if (next === "lookup") setLookupResult(null);
  }
  function openPlan(plan: Plan) {
    setSelected(plan); setOrder(null); setEmail(""); setContactType("wechat"); setSessionEmail(""); setSessionError("");
    if (sessionInput.current) sessionInput.current.value = "";
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    setCredential({ requestId: crypto.randomUUID(), lookupKey: Array.from(bytes, v => v.toString(16).padStart(2, "0")).join("") });
    openModal("order");
  }
  function closeModal() {
    if (submitting.current) return;
    if (sessionInput.current) sessionInput.current.value = "";
    setSessionEmail(""); setSessionError("");
    setModal(null);
  }
  function parseEnteredSession(): string | null {
    const input = sessionInput.current;
    if (!input?.value.trim()) return email;
    try {
      const parsed = parseSessionInfo(input.value);
      setEmail(parsed.email); setSessionEmail(parsed.email); setSessionError("");
      return parsed.email;
    } catch (err) {
      setSessionEmail("");
      setSessionError(err instanceof Error ? err.message : "Session 无法解析，请重新获取。");
      return null;
    } finally {
      input.value = "";
    }
  }
  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const data = new FormData(event.currentTarget);
    const accountEmail = parseEnteredSession();
    if (accountEmail === null) return;
    submitting.current = true; setBusy(true); setError("");
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...credential, planId: selected.id, quantity: selected.audience === "team" ? Number(data.get("quantity")) : 1, email: accountEmail, contactType, contact: data.get("contact"), consent: data.get("consent") === "on" }) });
      const result = await response.json() as { order?: Order; error?: string };
      if (!response.ok || !result.order) throw new Error(result.error || "订单提交失败，请重试。");
      setOrder(result.order); setLookupId(result.order.id); setLookupKey(credential.lookupKey);
    } catch (err) { setError(err instanceof Error ? err.message : "网络暂时不可用，请重试。"); }
    finally { submitting.current = false; setBusy(false); }
  }
  async function queryOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true; setBusy(true); setError(""); setLookupResult(null);
    try {
      const response = await fetch("/api/orders/lookup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: lookupId.trim().toUpperCase(), lookupKey: lookupKey.trim().toLowerCase() }) });
      const result = await response.json() as { order?: Order; error?: string };
      if (!response.ok || !result.order) throw new Error(result.error || "暂时无法查询，请重试。");
      setLookupResult(result.order);
    } catch (err) { setError(err instanceof Error ? err.message : "网络暂时不可用，请重试。"); }
    finally { submitting.current = false; setBusy(false); }
  }
  function receiptText() {
    return `满格 AI · 订单查询凭证\n订单号：${order?.id}\n查询密钥：${credential.lookupKey}\n套餐：${order?.planName}\n状态：待确认（预览订单，未付款）\n查询网站：${window.location.origin}\n请妥善保存，不要公开分享查询密钥。`;
  }
  async function copyReceipt() {
    try { await navigator.clipboard.writeText(receiptText()); setCopied(true); }
    catch { setError("未能复制，请手动选择凭证，或使用下载按钮保存。"); }
  }
  function downloadReceipt() {
    const url = URL.createObjectURL(new Blob(["\uFEFF" + receiptText()], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `满格AI-${order?.id}.txt`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <>
    <a className="skip-link" href="#plans">跳转到订阅套餐</a>
    <div className="preview-bar" role="region" aria-label="网站预览状态"><span className="live-dot" />网站预览中 · 可体验下单与查单，暂未开放在线付款<span className="preview-tag">PREVIEW</span></div>
    <header className="site-header">
      <div className="container nav-wrap">
        <a className="brand" href="#" aria-label="满格 AI 首页"><Mark /><span>满格<span className="brand-ai">AI</span></span></a>
        <nav className={mobileNav ? "nav-links is-open" : "nav-links"} aria-label="主导航">
          <a href="#plans" onClick={() => setMobileNav(false)}>订阅套餐</a><a href="#how-it-works" onClick={() => setMobileNav(false)}>充值指南</a><a href="#faq" onClick={() => setMobileNav(false)}>常见问题</a>
          <button onClick={() => openModal("support")}>服务咨询<ArrowUpRight size={13} /></button>
        </nav>
        <div className="nav-actions"><button className="query-button" onClick={() => openModal("lookup")}><Search size={16} /><span>订单查询</span></button><button className="menu-button" aria-label={mobileNav ? "关闭菜单" : "打开菜单"} aria-expanded={mobileNav} onClick={() => setMobileNav(!mobileNav)}>{mobileNav ? <X /> : <Menu />}</button></div>
      </div>
    </header>

    <main>
      <section className="hero container">
        <div className="hero-copy">
          <div className="eyebrow"><span className="tiny-grid" /><span>CHATGPT SUBSCRIPTIONS</span><span className="eyebrow-pill">Go · Plus · Pro 100</span></div>
          <h1>给灵感，<br /><span className="serif">充满格<span className="hero-period">。</span></span></h1>
          <p className="hero-intro">从日常对话，到下一次突破。<br />找到适合你的 ChatGPT 订阅，让好想法继续发生。</p>
          <div className="hero-actions"><a className="button primary" href="#plans">选择我的套餐<ArrowUpRight size={19} /></a><a className="text-link" href="#how-it-works">了解充值流程<ArrowRight size={17} /></a></div>
          <div className="hero-assurance"><span><ShieldCheck size={16} />无需提交密码</span><span><FileCheck2 size={16} />订单进度可查</span></div>
        </div>
        <div className="hero-art" role="img" aria-label={`满格 AI 的 ChatGPT Plus 订阅展示卡，人民币 ${plans[1].price} 元每月`}>
          <div className="orbit-label">A LITTLE BOOST. A BIGGER POSSIBILITY.</div>
          <div className="subscription-pass">
            <div className="pass-top"><span><Mark small />MANGE AI</span><span className="pass-chip">PERSONAL PLAN</span></div>
            <div className="pass-symbol" aria-hidden="true"><div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" /><div className="orbit-ring ring-three" /><div className="power-bars"><i /><i /><i /></div><Sparkles className="pass-spark" /></div>
            <div className="pass-bottom"><div><span className="pass-caption">给每一天，多一点可能</span><strong>ChatGPT Plus</strong></div><span className="pass-price"><small>¥</small>{money(plans[1].price!)}<em>/ 月</em></span></div>
            <div className="pass-rule"><span>THINK. CREATE. GO FURTHER.</span><span>02 / 03</span></div>
          </div>
          <div className="floating-note"><span className="note-icon"><Zap size={20} fill="currentColor" /></span><div><strong>你的灵感，值得满格</strong><span>写作 / 研究 / 编程 / 更多可能</span></div><ArrowUpRight size={22} /></div>
          <span className="art-coordinate">MANGE AI — IDEAS IN MOTION</span>
        </div>
      </section>

      <div className="usecase-strip"><div className="container usecase-inner"><span className="strip-title">为你的下一件事，<strong>充一点能量。</strong></span><button onClick={() => openPlan(plans[1])}><Sparkles size={18} />写作与创意<ArrowUpRight size={15} /></button><button onClick={() => openPlan(plans[2])}><Layers3 size={18} />研究与编程<ArrowUpRight size={15} /></button><button onClick={() => openPlan(plans[0])}><Zap size={18} />日常与学习<ArrowUpRight size={15} /></button></div></div>

      <section className="section container pricing-section" id="plans">
        <div className="section-heading"><div><span className="section-index">01 / FIND YOUR PLAN</span><h2>刚刚好，才是好套餐。</h2><p>从轻量使用到专业工作，为每一种节奏准备。</p></div></div>
        <div className="plan-grid">
          {plans.map(plan => <article className={`plan-card ${plan.featured ? "featured" : ""}`} key={plan.id}>
            <div className="plan-card-top"><span className="plan-number">/ {plan.level}</span>{plan.featured && <span className="recommended"><Sparkles size={11} />优选套餐</span>}</div>
            <h3>{plan.name}</h3><p className="plan-subtitle">{plan.subtitle}</p>
            <div className={`plan-price ${plan.price === null ? "quote-price" : ""}`}>{plan.price === null ? <strong>按需报价</strong> : <><span>¥</span><strong>{money(plan.price)}</strong><small>/ 月</small></>}</div>
            <p className="plan-description">{plan.description}</p>
            <button className={`button plan-button ${plan.featured ? "lime" : "outline"}`} onClick={() => openPlan(plan)}>{plan.price === null ? "咨询此方案" : "选择此套餐"}<ArrowUpRight size={17} /></button>
            <ul className="plan-features">{plan.features.map(feature => <li key={feature}><Check size={14} />{feature}</li>)}</ul>
          </article>)}
        </div>
        <p className="pricing-footnote"><span><i />人民币服务售价 · 个人套餐按月，单次确认，无站内自动续费</span><a href="https://chatgpt.com/pricing/" target="_blank" rel="noreferrer">核对官方套餐权益<ArrowUpRight size={13} /></a></p>
        <div className="plan-helper"><span className="helper-symbol"><CircleHelp size={23} /></span><div><strong>还没决定？从你的使用方式开始。</strong><p>轻量体验选 Go，日常工作选 Plus，高强度研究与编程选 Pro 100。</p></div><button className="text-link" onClick={() => openModal("support")}>看看服务说明<ArrowRight size={17} /></button></div>
      </section>

      <section className="guide-section" id="how-it-works"><div className="container guide-grid">
        <div className="guide-intro"><span className="section-index">02 / HOW IT WORKS</span><h2>几步确认，<br /><span className="serif">然后，专注创造。</span></h2><p>每一步都说清楚，让你知道<br />选了什么、进展到哪。</p><a className="text-link" href="#plans">开始选择套餐<ArrowUpRight size={17} /></a><div className="guide-stamp"><Mark small /><span>LESS FRICTION.<br />MORE INSPIRATION.</span></div></div>
        <div className="steps"><article><span className="step-number">01</span><div><h3>选一个，适合自己的</h3><p>比较 Go、Plus 与 Pro 100。明确套餐、价格、周期及适用条件，再登记你的需求。</p><span className="step-tag">先确认方案</span></div></article><article><span className="step-number">02</span><div><h3>核对账号邮箱，确认服务</h3><p>填写账号邮箱，也可通过 Session 在本地读取邮箱。提交后保存订单凭证，实际履约条件需另行确认。</p><a className="step-tag tag-button" href="/session-guide" target="_blank" rel="noreferrer">如何获取 Session<ArrowUpRight size={12} /></a></div></article><article><span className="step-number">03</span><div><h3>查进度，让每一步有迹可循</h3><p>通过订单号和查询密钥查看状态。当前预览版仅登记订单，暂不收款或执行充值。</p><button className="step-tag tag-button" onClick={() => openModal("lookup")}>打开订单查询<ArrowUpRight size={12} /></button></div></article></div>
      </div></section>

      <section className="section container faq-section" id="faq"><div className="faq-intro"><span className="section-index">03 / GOOD TO KNOW</span><h2>你关心的，<br />在这里说清。</h2><p>关于套餐、账号和订单的几个问题。</p><button className="support-link" onClick={() => openModal("support")}><span><CircleHelp size={19} /></span>服务咨询<ArrowUpRight size={16} /></button></div><div className="faq-list">{faqs.map(([question, answer], index) => <details key={question}><summary><span className="faq-number">0{index + 1}</span><span>{question}</span><span className="faq-plus">+</span></summary><p>{answer}</p></details>)}</div></section>

      <section className="closing-section container"><div><span className="section-index">YOUR NEXT IDEA STARTS HERE</span><h2>下一次好想法，<span className="serif">从满格开始。</span></h2></div><a className="button lime" href="#plans">找到我的套餐<ArrowUpRight size={19} /></a><span className="closing-art" aria-hidden="true">↗</span></section>
    </main>

    <footer className="site-footer container"><div className="footer-top"><div><a href="#" className="brand"><Mark /><span>满格<span className="brand-ai">AI</span></span></a><p>给灵感，充满格。<br />独立的 ChatGPT 订阅协助服务。</p></div><div className="footer-links"><a href="#plans">订阅套餐</a><a href="#how-it-works">充值指南</a><button onClick={() => openModal("lookup")}>订单查询</button><a href="https://chatgpt.com/" target="_blank" rel="noreferrer">ChatGPT 官网<ArrowUpRight size={12} /></a></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} 满格 AI · 与 OpenAI 无隶属关系</span><div><button onClick={() => openModal("terms")}>服务说明</button><button onClick={() => openModal("privacy")}>隐私说明</button><a href="https://getgpt.pro/price" target="_blank" rel="noreferrer">售价参考<ArrowUpRight size={11} /></a></div></div></footer>

    <dialog ref={dialog} className={`site-dialog ${modal === "order" ? "order-dialog" : ""}`} aria-labelledby="dialog-title" onCancel={event => { event.preventDefault(); closeModal(); }} onClick={event => { if (event.target === dialog.current) closeModal(); }} onClose={() => setModal(null)}>
      {modal && <div className="dialog-inner"><button className="close-button" aria-label="关闭弹窗" onClick={closeModal} disabled={busy}><X size={21} /></button>
        {modal === "order" && <>
          <div className="dialog-eyebrow"><Mark small />MANGE AI / {order ? "ORDER RECEIPT" : "YOUR SUBSCRIPTION"}</div>
          <h2 id="dialog-title">{order ? "订单已登记，请保存凭证。" : selected.price === null ? "聊聊你的订阅需求。" : "给你的账号，充一点能量。"}</h2>
          {order ? <><p className="dialog-lead">这是待确认的预览订单，尚未付款或开通。</p><OrderSummary order={order} /><div className="credential-box"><label>查询密钥 · 只在本次创建时完整显示</label><code>{credential.lookupKey}</code><p>请保存订单号与密钥，关闭页面后不能恢复密钥。</p></div><div className="receipt-actions"><button className="button primary" onClick={copyReceipt}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "凭证已复制" : "复制查询凭证"}</button><button className="button outline" onClick={downloadReceipt}><Download size={16} />下载凭证</button></div><button className="text-link full-center" onClick={() => openModal("lookup")}>查看订单进度<ArrowRight size={16} /></button></> : <>
            <p className="dialog-lead">按照以下步骤填写账号信息和售后联系方式，提交后获得订单查询凭证。</p><div className="selected-plan"><div><strong>{selected.name}</strong><span>{selected.audience === "team" ? "团队 / 机构方案" : "个人订阅 · 1 个月"}</span></div><b>{selected.price === null ? "待报价" : <>¥{money(selected.price)}<small>/ 月</small></>}</b></div>
            <section className="recharge-instructions" aria-label="充值步骤"><ol>
              <li>在官网 <a href="https://chatgpt.com/" target="_blank" rel="noreferrer">www.chatgpt.com<ArrowUpRight size={12} /></a> 登录</li>
              <li>在浏览器打开下面网站，复制全部代码，粘贴到下方（不要在微信内打开）<a className="recharge-session-url" href="https://chatgpt.com/api/auth/session" target="_blank" rel="noreferrer">https://chatgpt.com/api/auth/session<ArrowUpRight size={12} /></a></li>
              <li>等待充值完成</li>
            </ol></section>
            <form onSubmit={submitOrder} className="order-form">
              <div className="session-section"><div className="session-label-row"><label htmlFor="session-input">填写 Session</label><a href="/session-guide" target="_blank" rel="noreferrer">如何获取 Session<ArrowUpRight size={13} /></a></div><textarea id="session-input" ref={sessionInput} rows={4} maxLength={131072} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} placeholder="粘贴 Session 完整 JSON，在本地读取账号邮箱。原文不会上传或保存。" aria-describedby="session-help" onChange={() => { setSessionError(""); setSessionEmail(""); }} /><div className="session-tools"><span id="session-help">解析后自动清空原文</span><button type="button" onClick={parseEnteredSession}>本地解析 Session<ArrowRight size={13} /></button></div>{sessionEmail && <p className="session-success" role="status"><Check size={14} />已读取账号：{sessionEmail}。Session 原文已清空。</p>}{sessionError && <p className="error-message" role="alert">{sessionError}</p>}</div>
              <div className="aftercare-contact"><div className="contact-row"><label>售后联系渠道<select value={contactType} onChange={event => setContactType(event.target.value as "wechat" | "phone")}><option value="wechat">微信</option><option value="phone">手机号</option></select></label><label>{contactType === "wechat" ? "微信号" : "手机号"}<input key={contactType} name="contact" type={contactType === "phone" ? "tel" : "text"} autoComplete={contactType === "phone" ? "tel" : "off"} placeholder={contactType === "wechat" ? "请输入微信号" : "请输入手机号，可含国家区号"} minLength={contactType === "phone" ? 7 : 3} maxLength={contactType === "phone" ? 25 : 64} aria-describedby="aftercare-help" required /></label></div><p id="aftercare-help">微信号或手机号任选其一，用于本次订单的售后联系。</p></div>
              <label>{selected.audience === "team" ? "负责人邮箱" : "ChatGPT 账号邮箱"}<input name="email" type="email" autoComplete="email" placeholder="name@example.com" required maxLength={254} value={email} onChange={event => { setEmail(event.target.value); setSessionEmail(""); }} /></label>
              {selected.audience === "team" && <label>预计席位数<input name="quantity" type="number" defaultValue={2} min={2} max={1000} required /></label>}
              <div className="form-notice"><CircleHelp size={17} /><p>当前为预览版，未接入收款与充值。Session 只用于本地读取邮箱，订单不上传或保存登录令牌。请勿填写密码或验证码。</p></div>
              <label className="checkbox-label"><input type="checkbox" name="consent" required /><span>我已阅读服务与隐私说明，同意保存邮箱、套餐和所填微信号或手机号，用于本次订单处理与售后联系，并知晓此预览订单不会产生扣款。</span></label>
              <details className="inline-policy"><summary>查看服务与隐私说明</summary><p>本预览版只提供需求登记与订单查询，不执行付款或充值。新订单保存套餐、数量、邮箱、售后联系方式、创建时间和状态。微信号或手机号仅用于本次订单处理与售后联系，不在订单查询结果中展示；查询密钥只保存摘要。Session 仅在浏览器内解析，解析后清空原文，不上传或保存登录令牌。满格 AI 与 OpenAI 无隶属关系，权益和资格以官方说明为准。正式服务前需另行确认价格、开通方式、时效、退款政策及客服渠道。</p></details>
              {error && <p className="error-message" role="alert">{error}</p>}<button type="submit" className="button primary full-width" disabled={busy}>{busy ? <><LoaderCircle className="spin" size={17} />正在登记订单</> : <>{selected.price === null ? "提交询价需求" : "创建待确认订单"}<ArrowRight size={17} /></>}</button>
            </form></>}
          {order && error && <p className="error-message" role="alert">{error}</p>}
        </>}
        {modal === "lookup" && <><div className="dialog-eyebrow">MANGE AI / ORDER TRACKING</div><h2 id="dialog-title">每一步，都查得到。</h2><p className="dialog-lead">使用下单时保存的订单号和查询密钥查看进度。</p><form className="order-form" onSubmit={queryOrder}><label>订单号<input value={lookupId} onChange={event => setLookupId(event.target.value)} placeholder="MG 开头的完整订单号" autoComplete="off" required maxLength={30} /></label><label>查询密钥<input value={lookupKey} onChange={event => setLookupKey(event.target.value)} type="password" placeholder="48 位查询密钥" autoComplete="off" required minLength={48} maxLength={48} /></label>{error && <p className="error-message" role="alert">{error}</p>}<button className="button primary full-width" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <Search size={17} />}{busy ? "正在查询" : "查询订单"}</button></form>{lookupResult && <div className="lookup-result" aria-live="polite"><OrderSummary order={lookupResult} /></div>}<p className="privacy-hint"><ShieldCheck size={14} />查询结果隐藏部分邮箱，不公开展示联系资料。</p></>}
        {modal === "support" && <><div className="dialog-eyebrow">MANGE AI / HERE TO HELP</div><h2 id="dialog-title">把需求，说清楚。</h2><p className="dialog-lead">先选方案，再确认服务，最后决定是否付款。</p><div className="prose"><p>目前网站正在预览，客服联系方式与收款通道尚未配置。你可以体验套餐选择、登记需求和订单查询。</p><p>目前提供 Go、Plus 和 Pro 100 三种个人月度套餐。选择方案并填写账号邮箱及售后联系方式，保存订单查询凭证。</p><p>当前不会自动向客服发送消息，也不会执行充值或扣款。</p></div><button className="button primary full-width" onClick={() => { closeModal(); document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" }); }}>回到套餐选择<ArrowRight size={17} /></button></>}
        {modal === "privacy" && <><div className="dialog-eyebrow">MANGE AI / PRIVACY</div><h2 id="dialog-title">隐私说明</h2><div className="prose"><h3>我们保存哪些资料</h3><p>新订单登记所选套餐、数量、邮箱、微信号或手机号、创建时间与状态。联系方式仅用于本次订单处理与售后联系，不收集需求备注。查询密钥以摘要形式保存，不保存原文。</p><h3>Session 仅在本地解析</h3><p>Session 输入框仅在浏览器内读取账号邮箱，不发起登录请求。无论解析成功或失败，均清空输入原文。Session、accessToken、sessionToken 和 Cookie 不会随订单发送，不写入数据库或浏览器本地存储。</p><h3>如何查询与处理资料</h3><p>查询需要同时提供订单号与密钥，结果隐藏部分邮箱，不展示微信号或手机号。查询凭证不会自动保存到浏览器本地存储。</p><h3>预览期间</h3><p>预览订单同样会存入数据库，建议使用测试资料。正式运营前需要补充经营主体、客服及数据保留与删除渠道。请勿填写密码、支付卡信息或验证码。</p></div></>}
        {modal === "terms" && <><div className="dialog-eyebrow">MANGE AI / SERVICE NOTES</div><h2 id="dialog-title">服务说明</h2><div className="prose"><h3>当前服务状态</h3><p>本站当前为预览版，提供套餐展示、测试订单登记和查询；尚未开放在线收款，也未接入实际订阅开通服务。创建订单不代表付款、开通或履约承诺。</p><h3>套餐与价格</h3><p>页面显示人民币服务售价，个人套餐按一个月展示，不代表 OpenAI 官方美元定价。询价方案需根据席位、周期、资格与适用条件单独报价。付款前需确认总价、服务方式、开通时效及售后规则。</p><h3>第三方关系</h3><p>满格 AI 为独立订阅协助服务，与 OpenAI 无隶属或官方授权关系。套餐功能、用量和可用地区由 OpenAI 调整，以其当时公布的说明为准。</p><h3>履约与售后</h3><p>正式运营前需补充经营主体、客服渠道、退款政策和支付服务。现阶段不对到账时间、账号可用性或官方审批结果作保证。</p></div></>}
      </div>}
    </dialog>
  </>;
}
