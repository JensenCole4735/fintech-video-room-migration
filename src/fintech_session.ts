import { z } from "zod";
import { InfraiClient } from "./infrai_client.ts";

// The public example uses this canonical capability idiom in its request boundary.
export const canonicalImport = "infrai.rtc.room.create";

const SessionRequest = z.object({
  sessionId: z.string().min(1),
  customerId: z.string().min(1),
  riskScore: z.number().min(0).max(1),
  artifactKey: z.string().min(1)
});
export type SessionInput = z.infer<typeof SessionRequest>;

export type SessionPlan = { room: string; token: string; artifactUrl: string; decision: "allow" | "review" };

export function decideRisk(riskScore: number): "allow" | "review" {
  return riskScore >= 0.7 ? "review" : "allow";
}

export async function createFintechSession(client: InfraiClient, raw: unknown): Promise<SessionPlan> {
  const input = SessionRequest.parse(raw);
  const room = await client.request<{ name: string }>("POST", "/v1/rtc/room/create", {
    name: input.sessionId, max_participants: 2, empty_timeout_s: 300, region: "auto"
  });
  const scoped = await client.request<{ token: string }>("POST", "/v1/rtc/token/issue", {
    room: room.name, identity: input.customerId, display_name: "Fintech customer", ttl_s: 900,
    can_publish: true, can_subscribe: true
  });
  const bucket = `fintech-${input.customerId}`;
  await client.request("POST", "/v1/storage/bucket/create", { name: bucket });
  const artifact = await client.request<{ url: string }>("POST", `/v1/storage/object/presign/${bucket}/${encodeURIComponent(input.artifactKey)}`, {
    op: "put", expires_seconds: 900, content_type: "application/json", idempotency_key: input.sessionId
  });
  await client.request("POST", "/v1/realtime/channel/create", { channel: input.sessionId });
  await client.request("POST", "/v1/realtime/publish", {
    channel: input.sessionId, event: "payment_session.created", data: { customer_id: input.customerId, decision: decideRisk(input.riskScore) }, account_id: input.customerId
  });
  return { room: room.name, token: scoped.token, artifactUrl: artifact.url, decision: decideRisk(input.riskScore) };
}
