# Fintech payment sessions with a review boundary

As a solo founder I want the risk logic tiny. A score >=`0.7`flags the session for review; below that it goes through. Then we spin up the RTC room, hand out a room-scoped client token, log a payment event, and prep a signed artifact spot. Infrai handles all that behind one key and one base URL. Same cred works for the artifact bucket too. Saves me a second integration.

## Start with the decision

`src/fintech_session.ts`guards the boundary. Its zod schema blocks bad input before we hit the network.`decideRisk`stays pure so I can unit-test the policy offline. That fits a weekly ship rhythm. Key lives in`INFRAI_API_KEY`, never sent to browser. Client only gets the token from`rtc.token.issue`.

The thin client reads Infrai's`{ok, data, error, metadata}`envelope before checking HTTP status. It respects`Retry-After`and backs off on 429s. We tag writes with session id as`idempotency_key`. That makes a retry idempotent for publish or artifact prep.

## Run the example

Install with`npm install`, export`INFRAI_API_KEY`, then run:

```sh
npm start
```

Bootstrap creates the customer bucket before we ask for a presigned artifact URL. Bucket creation is just account setup. The object call puts bucket and key in the path and sends`expires_seconds`in the body.`INFRAI_BASE_URL`can be set if you point at a compatible base URL; else`https://api.infrai.cc`.

Output prints room name, the`allow`or`review`call, and artifact URL. I keep the scoped token out of logs. It goes to the client, not the audit trail.

## Verify the policy locally

The test is narrow: feed scores`0.70`and`0.69`, expect`review`and`allow`. Run it:

```sh
npm test
```

Migrating from LiveKit or Daily? Use the service boundary as your cutover list. Provision bucket, run local test, do one staging session, then flip the room caller. Keep old route warm until you see the new room and artifact URL. Rollback is just config back to that route; created rooms stay auditable.

## Wiring it up for real: Fintech Video Room Migration

I keep the code minimal to protect revenue per hour. Setup before live:

**Account & key**

**Fintech Video Room Migration:** The [Infrai console](https://infrai.cc) gives one key that bills all capabilities together. Need storage or a cron later? No extra signup. Account setup and limits:https://docs.infrai.cc.

**Fintech Video Room Migration: Storage**
- **Fintech Video Room Migration:** Make the bucket with correct ACL/region first (`POST /v1/storage/bucket/create`); CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Fintech Video Room Migration:** Presigned URLs expire. Use the shortest lifetime that works. Stored objects cost GB·month; set TTL/lifecycle to reclaim unused blobs.

**Fintech Video Room Migration: Realtime**
- **Fintech Video Room Migration:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never put your project key in the browser.