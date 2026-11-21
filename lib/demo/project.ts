// Node and Express: the project Amina is working on in the tour.
export type DemoCheck = {
  id: string;
  label: string;
  result: "pass" | "fail";
  note: string;
  /** Only for failing checks: what to change. */
  fix?: string;
};

export const NODE_EXPRESS = {
  id: "node-express",
  title: "Node and Express",
  verifiedHours: 38,
  totalHours: 96,
  percent: 62,
  projectTitle: "Notes API",
  brief:
    "Build an Express app with routes to create, read, update and delete notes held in memory, with clear error messages.",
  repoUrl: "https://github.com/example/notes-api",
  checks: [
    {
      id: "starts",
      label: "Server starts with npm start",
      result: "pass",
      note: "The server started on the port from your README and answered the first request.",
    },
    {
      id: "routes",
      label: "All routes work",
      result: "pass",
      note: "Create, read, update and delete all returned the right data.",
    },
    {
      id: "errors",
      label: "Sensible error handling",
      result: "fail",
      note: "Asking for a note that does not exist returns status 200 with an empty body.",
      fix: "Send status 404 with a JSON message when no note matches, and 400 when the title is missing.",
    },
    {
      id: "readme",
      label: "Clear README with example requests",
      result: "pass",
      note: "The README lists every route with a request you can copy.",
    },
  ] as DemoCheck[],
} as const;
