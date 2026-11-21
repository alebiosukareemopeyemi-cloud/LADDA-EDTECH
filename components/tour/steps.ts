// The seven steps. Copy is plain and sentence case. `target` is a data-tour id
// on the screen underneath; null (or a missing element) centres the card.
export type TourStepId = "problem" | "cv" | "roadmap" | "project" | "feedback" | "credential" | "employer";

export type TourStep = {
  id: TourStepId;
  target: string | null;
  title: string;
  body: string;
  /** Seconds before autoplay moves on. null stops autoplay here. */
  seconds: number | null;
};

export const STEPS: TourStep[] = [
  {
    id: "problem",
    target: "trail",
    title: "Your CV lists skills. Nobody can check them.",
    body: "Amina studies computer science at the University of Lagos. Her CV says Node.js, but an employer cannot tell what is real. Ladda turns the path to a backend job into a trail with proof at every stop.",
    seconds: 13,
  },
  {
    id: "cv",
    target: "cv-result",
    title: "Upload your CV",
    body: "Ladda reads your CV and marks what you already know. Three skills match, so Amina skips about 20 hours of learning. A known skill still needs a project before it counts as verified.",
    seconds: 13,
  },
  {
    id: "roadmap",
    target: "node-node-express",
    title: "Your roadmap",
    body: "Each node ends with a real project. Amina has verified two nodes and is 62 percent through Node and Express. The next nodes unlock as she finishes.",
    seconds: 12,
  },
  {
    id: "project",
    target: "project",
    title: "Do the project",
    body: "Node and Express asks for a notes API. Paste any repo link and a reviewer checks it against four points. This is a simulation: nothing is sent anywhere.",
    seconds: 18,
  },
  {
    id: "feedback",
    target: "feedback",
    title: "Feedback you can act on",
    body: "Every check gets a verdict and a reason. Here one check fails, and the note says exactly how to fix it. Amina fixes it, submits again, and the node turns verified.",
    seconds: 13,
  },
  {
    id: "credential",
    target: "passport",
    title: "Your credential",
    body: "When the path is done, Ladda issues a signed passport page. It lists every verified project, the repo and commit behind each score, and the hours.",
    seconds: 12,
  },
  {
    id: "employer",
    target: "verify",
    title: "Employer check",
    body: "An employer opens the link with no account, and their browser checks the signature. Change the hours from 96 to 960 and run the check again.",
    seconds: null,
  },
];
