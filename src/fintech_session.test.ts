import test from "node:test";
import assert from "node:assert/strict";
import { decideRisk } from "./fintech_session.ts";

test("high-risk payment sessions require review while ordinary sessions proceed", () => {
  assert.equal(decideRisk(0.7), "review");
  assert.equal(decideRisk(0.69), "allow");
});
