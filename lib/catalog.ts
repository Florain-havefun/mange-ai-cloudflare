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
  { id: "go", name: "ChatGPT Go", subtitle: "日常灵感，轻松起步", audience: "personal", price: 88, level: "01", description: "适合从免费版迈出下一步的日常使用者。", features: ["更充裕的日常对话额度", "文件上传与图像创作", "个人账号 · 按月订阅" ] },
  { id: "plus", name: "ChatGPT Plus", subtitle: "工作与生活的好搭档", audience: "personal", price: 179, level: "02", featured: true, description: "写作、学习、研究，让常用工具更进一步。", features: ["进阶推理与深度研究", "图像、文件与多模态工具", "个人账号 · 按月订阅" ] },
  { id: "pro100", name: "Pro 100", subtitle: "为高强度创作而来", audience: "personal", price: 879, level: "03", description: "面向需要更多高级工具用量的专业用户。", features: ["对应官方 Pro $100 档位", "适合研究与编程工作流", "个人账号 · 按月订阅" ] },
  { id: "pro200", name: "Pro 200", subtitle: "把专业能力，再推进一步", audience: "personal", price: 1569, level: "04", description: "在不同 Pro 档位中选择匹配你的使用方案。", features: ["对应官方 Pro $200 档位", "下单前确认适用权益", "个人账号 · 按月订阅" ] },
  { id: "pro500", name: "Pro 500", subtitle: "面向更密集的专业工作", audience: "personal", price: null, level: "05", description: "更高档位的 Pro，按需求单独确认报价。", features: ["对应官方 Pro $500 档位", "按当前权益与适用条件确认", "个人账号 · 一对一询价" ] },
  { id: "business-standard", name: "Business Standard", subtitle: "让团队，一起满格", audience: "team", price: null, level: "06", description: "团队工作空间，按席位、周期和需求报价。", features: ["团队协作与工作空间管理", "席位数量与周期单独确认", "按官方适用条件开通" ] },
  { id: "business-premium", name: "Business Premium", subtitle: "为团队的进阶需求准备", audience: "team", price: null, level: "07", description: "结合团队规模和实际使用方式确认方案。", features: ["团队进阶方案咨询", "席位与权益在报价时确认", "按官方适用条件开通" ] },
  { id: "enterprise", name: "Enterprise", subtitle: "为组织，定制下一步", audience: "team", price: null, level: "08", description: "企业需求登记与方案咨询，适用条件另行评估。", features: ["企业规模与需求梳理", "采购与开通方式另行确认", "报价与履约条件单独协商" ] },
  { id: "edu", name: "ChatGPT Edu", subtitle: "把 AI 带进校园", audience: "team", price: null, level: "09", description: "面向符合资格的教育机构提供方案咨询。", features: ["机构资格与需求预审", "院校规模与席位规划", "官方审批与适用条件另行确认" ] },
];

export const storeConfig = {
  name: "满格 AI",
  preview: true,
  paymentEnabled: false,
  contact: null as string | null,
};

export const getPlan = (id: string) => plans.find((plan) => plan.id === id);
