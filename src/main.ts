import { InfraiClient } from "./infrai_client.ts";
import { createFintechSession } from "./fintech_session.ts";

const client = new InfraiClient();
const result = await createFintechSession(client, {
  sessionId: "payment-review-2026-001", customerId: "customer-42", riskScore: 0.82, artifactKey: "audit/session.json"
});
console.log(JSON.stringify({ room: result.room, decision: result.decision, artifactUrl: result.artifactUrl }));
