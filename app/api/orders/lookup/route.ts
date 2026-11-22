import { errorReply, findOrder, lookupInput, readInput, reply } from "@/lib/orders";

export async function POST(request: Request) {
  try {
    const input = lookupInput.safeParse(await readInput(request));
    if (!input.success) return reply({ error: "请填写完整的订单号和查询密钥。" }, 400);
    const order = await findOrder(input.data);
    return order ? reply({ order }) : reply({ error: "未找到订单，请核对订单号与查询密钥。" }, 404);
  } catch (error) { return errorReply(error); }
}
