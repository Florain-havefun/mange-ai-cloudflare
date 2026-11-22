import { createOrder, errorReply, orderInput, readInput, reply } from "@/lib/orders";

export async function POST(request: Request) {
  try {
    const input = orderInput.safeParse(await readInput(request));
    if (!input.success) return reply({ error: "请填写有效的账号邮箱与售后联系方式，并确认服务说明。" }, 400);
    return reply({ order: await createOrder(input.data) }, 201);
  } catch (error) { return errorReply(error); }
}
