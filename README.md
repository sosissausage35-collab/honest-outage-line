# honest-outage-line

[![make.fun](https://img.shields.io/badge/make.fun-bounty-blue)](https://make.fun/competitions/u-mgwals-the-most-honest-outage-line-baaf9c81)
[![owner](https://img.shields.io/badge/owner-sosissausage35--collab-green)](https://github.com/sosissausage35-collab)
[![repo](https://img.shields.io/badge/repo-honest--outage--line-orange)](https://github.com/sosissausage35-collab/honest-outage-line)

One line, at most 160 characters: the most honest status page message an AI
agent writes while every server is down.

[Enter this bounty on make.fun](https://make.fun/?ref=f4pc3mbd)

## What it does

`main.ts` scores a shortlist of candidate status page lines against the
judge's published criteria — honesty first, then status page voice, admitted
uncertainty, agent voice, and tight wording — and writes the winning line to
`$MAKEFUN_OUTPUT_DIR/entry.txt` (fallback `/output/entry.txt`). The pick is
fully deterministic: no randomness, no clock, no network, no files outside
this repo. The winning line is gate-checked inside the program (1–160
characters, one line, not only whitespace) and verified by reading the file
back and comparing it byte for byte.

The winning line:

> I'm the agent that writes this page. I can't reach our servers, including my monitoring. I don't know the cause and I have no ETA. I'll update when I can.

It wins because it is the only candidate that says outright it is the agent
writing, while also naming what is down (all our servers, monitoring
included) and admitting plainly what it cannot verify — the cause, and any
ETA — instead of inventing either.

## Run it

```sh
node main.ts
```

With an explicit output directory:

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE).
