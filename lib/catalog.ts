export type Plan = {
  id: string;
  name: string;
  subtitle: string;
  audience: "personal" | "team";
  price: number | null;
  description: string;
  features: string[];
  level: string;
  featured?: boolean;
};

// 售卖价格（人民币），与 OpenAI 官方美元定价分开维护。
export const plans: Plan[] = [
  { id: "go", name: "ChatGPT Go", subtitle: "日常灵感，轻松起步", audience: "personal", price: 50, level: "01", description: "适合从免费版迈出下一步的日常使用者。", features: ["更充裕的日常对话额度", "文件上传与图像创作", "个人账号 · 按月订阅" ] },
  { id: "plus", name: "ChatGPT Plus", subtitle: "工作与生活的好搭档", audience: "personal", price: 130, level: "02", featured: true, description: "写作、学习、研究，让常用工具更进一步。", features: ["进阶推理与深度研究", "图像、文件与多模态工具", "个人账号 · 按月订阅" ] },
  { id: "pro100", name: "Pro 100", subtitle: "为高强度创作而来", audience: "personal", price: 680, level: "03", description: "面向需要更多高级工具用量的专业用户。", features: ["对应官方 Pro $100 档位", "适合研究与编程工作流", "个人账号 · 按月订阅" ] },
];

export const storeConfig = {
  name: "满格 AI",
  preview: true,
  paymentEnabled: false,
  contact: null as string | null,
};

export const getPlan = (id: string) => plans.find((plan) => plan.id === id);
