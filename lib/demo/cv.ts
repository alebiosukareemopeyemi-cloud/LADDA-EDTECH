// What Ladda "reads" from Amina's CV in the tour. Hours come from the catalog.
export type CvMatch = { nodeId: string; label: string; evidence: string; hours: number };

export const CV_LINES = [
  "BSc Computer Science, University of Lagos, expected 2027",
  "Used Git and GitHub for every course project and a team capstone",
  "Built a REST client that calls the university timetable service",
  "Designed a student results database in PostgreSQL for CSC 305",
  "Skills: JavaScript, Node.js, SQL, Linux",
];

export const CV_MATCHES: CvMatch[] = [
  { nodeId: "git-github", label: "Git and GitHub", evidence: "Used Git and GitHub for every course project", hours: 4 },
  { nodeId: "http-rest", label: "HTTP and REST", evidence: "Built a REST client", hours: 6 },
  { nodeId: "sql-postgres", label: "SQL and Postgres", evidence: "Designed a student results database in PostgreSQL", hours: 10 },
];

export const CV_HOURS_SAVED = CV_MATCHES.reduce((n, m) => n + m.hours, 0);
