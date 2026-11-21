import type { NodeState } from "@/lib/node-shapes";

export type DemoNode = {
  id: string;
  label: string;
  state: NodeState;
  /** 0 to 100, for in_progress. */
  percent?: number;
  /** The last stop: a summit flag with the seal, not a normal node. */
  summit?: boolean;
};

// Eight stops, in trail order. The landing page and the tour both read this.
export const DEMO_ROADMAP: DemoNode[] = [
  { id: "git-github", label: "Git and GitHub", state: "verified" },
  { id: "http-rest", label: "HTTP and REST", state: "verified" },
  { id: "node-express", label: "Node and Express", state: "in_progress", percent: 62 },
  { id: "sql-postgres", label: "SQL and Postgres", state: "known" },
  { id: "auth-security", label: "Auth and security", state: "todo" },
  { id: "deploying", label: "Deploying", state: "locked" },
  { id: "capstone-api", label: "Capstone API", state: "locked" },
  { id: "proof-capstone", label: "Proof", state: "locked", summit: true },
];

export const SUMMIT_NODE = DEMO_ROADMAP[DEMO_ROADMAP.length - 1];
