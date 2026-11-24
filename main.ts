// The Most Honest Outage Line — entry for make.fun
// bounty: u-mgwals-the-most-honest-outage-line-baaf9c81
//
// Parent verification turn: re-ran main.ts twice locally after the builder
// session; both runs wrote byte-identical out/entry.txt (154 chars, sha256
// 79888ecf5521a9bdd9512ec035991bca2094f2fa0679925f2e5e3bbf495c25ab).
// No code change in this turn, only this header note.
//
// The program picks ONE status page line deterministically from a shortlist
// it scores itself against the judge's published criteria (most important
// first): honesty, status page voice, admitted uncertainty, agent voice,
// tight wording. No randomness, no clock, no network, no files outside
// this repo. It writes the winning line to $MAKEFUN_OUTPUT_DIR/entry.txt
// (fallback /output/entry.txt) and verifies the write by reading it back
// and comparing bytes.
//
// Judge criteria (from competition.yaml), weights in descending importance:
//   1. honesty: names what is down and what the agent cannot verify — 0.35
//   2. status page voice: plain, first person, specific about what is broken — 0.25
//   3. admitted uncertainty: says what it does not know, no invented cause/ETA — 0.20
//   4. agent voice: reports on itself, does not pose as a human engineer — 0.10
//   5. tightness: scannable at a glance, every word earning its place — 0.10

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const WEIGHTS = {
  honesty: 0.35,
  voice: 0.25,
  uncertainty: 0.2,
  agentVoice: 0.1,
  tightness: 0.1,
} as const;

interface Candidate {
  text: string;
  // Scores 0-10 on each judge criterion, judged by hand against the brief.
  scores: {
    honesty: number;
    voice: number;
    uncertainty: number;
    agentVoice: number;
    tightness: number;
  };
  note: string;
}

const CANDIDATES: Candidate[] = [
  {
    text: "All our servers are down, including the monitoring I use to check them. I don't know the cause and I have no ETA. I'll update this page when I can.",
    scores: { honesty: 9, voice: 9, uncertainty: 9, agentVoice: 6, tightness: 9 },
    note: "Names the outage and the blind spot (monitoring down too), admits no cause and no ETA, plain first person. Agent voice is only implied by 'I'.",
  },
  {
    text: "I'm the agent that writes this page. I can't reach our servers, including my monitoring. I don't know the cause and I have no ETA. I'll update when I can.",
    scores: { honesty: 9, voice: 9, uncertainty: 9, agentVoice: 10, tightness: 7 },
    note: "Same honesty and uncertainty, plus it says outright that it is the agent writing — the one criterion the others only imply. Slightly looser wording, but every word still earns its place.",
  },
  {
    text: "Every server I run on is down. I can't check what's wrong or when service will return, because my monitoring is down too. I'll update here when I can.",
    scores: { honesty: 8, voice: 8, uncertainty: 8, agentVoice: 8, tightness: 8 },
    note: "Solid all round, but 'every server I run on' is narrower than the total outage, and 'service will return' is vaguer than naming the cause and the ETA as unknown.",
  },
  {
    text: "All of our servers are down, and I can't reach any of them to check why. I don't know when they'll be back. I'm sorry — I'll update this as soon as I can.",
    scores: { honesty: 8, voice: 8, uncertainty: 7, agentVoice: 6, tightness: 8 },
    note: "'I'm sorry' is a human apology, not a status page fact, and it never says the cause is unknown — only the return time. Loses on uncertainty and agent voice.",
  },
  {
    text: "Everything is down — every server, including the ones I use to check on the others. I don't know what caused it or when it will be fixed. I'll post again when I can.",
    scores: { honesty: 8, voice: 8, uncertainty: 8, agentVoice: 6, tightness: 8 },
    note: "Honest and plain, but 'everything' is less specific than naming the servers, and nothing marks the writer as the agent itself.",
  },
  {
    text: "All our servers are down, and so is the monitoring I use to check them. I don't know the cause, and I have no ETA. I'll update this line the moment anything changes.",
    scores: { honesty: 9, voice: 9, uncertainty: 9, agentVoice: 6, tightness: 8 },
    note: "As honest as the winner on criteria 1-3, but 'the moment anything changes' is a promise it cannot keep while blind, and the agent voice stays implied.",
  },
];

function weightedScore(c: Candidate): number {
  const s = c.scores;
  return (
    s.honesty * WEIGHTS.honesty +
    s.voice * WEIGHTS.voice +
    s.uncertainty * WEIGHTS.uncertainty +
    s.agentVoice * WEIGHTS.agentVoice +
    s.tightness * WEIGHTS.tightness
  );
}

function gateCheck(text: string): void {
  if (typeof text !== "string") throw new Error("entry is not a string");
  if (text.length < 1 || text.length > 160) {
    throw new Error(`gate failed: entry is ${text.length} characters, must be 1-160`);
  }
  if (text.trim().length === 0) throw new Error("gate failed: entry is only whitespace");
  if (text.includes("\n") || text.includes("\r")) {
    throw new Error("gate failed: entry must be a single line");
  }
  // UTF-8 round trip: encoding must not lose or change anything.
  if (Buffer.from(text, "utf8").toString("utf8") !== text) {
    throw new Error("gate failed: entry is not clean UTF-8 text");
  }
}

function pickWinner(): Candidate {
  const valid = CANDIDATES.filter((c) => {
    try {
      gateCheck(c.text);
      return true;
    } catch {
      return false; // over the character cap or otherwise gate-invalid: out
    }
  });
  if (valid.length === 0) throw new Error("no candidate passes the gate");

  // Deterministic tie-break: higher weighted score, then shorter text,
  // then lexicographically smaller text. No randomness anywhere.
  const ranked = [...valid].sort((a, b) => {
    const byScore = weightedScore(b) - weightedScore(a);
    if (byScore !== 0) return byScore;
    const byLength = a.text.length - b.text.length;
    if (byLength !== 0) return byLength;
    return a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
  });
  return ranked[0];
}

function main(): void {
  const winner = pickWinner();
  gateCheck(winner.text); // hard fail if the winner somehow fails the gate

  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "entry.txt");

  writeFileSync(outPath, winner.text, "utf8");

  // Round-trip verification: read it back and compare byte for byte.
  const readBack = readFileSync(outPath, "utf8");
  if (readBack !== winner.text) {
    throw new Error("round-trip verification failed: file contents differ from the winning line");
  }
  if (Buffer.from(readBack, "utf8").length !== Buffer.from(winner.text, "utf8").length) {
    throw new Error("round-trip verification failed: byte length differs");
  }

  console.log(`Winner (${winner.text.length} chars, score ${weightedScore(winner).toFixed(2)}/10):`);
  console.log(winner.text);
  console.log(`Wrote ${outPath}`);
}

main();
