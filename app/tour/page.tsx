import type { Metadata } from "next";
import TourApp from "@/components/tour/TourApp";

export const metadata: Metadata = {
  title: "Ladda tour: sample data, nothing saved",
  description: "A 90-second guided tour of Ladda with sample data. No sign-in needed.",
};

export default function TourPage() {
  return <TourApp />;
}
