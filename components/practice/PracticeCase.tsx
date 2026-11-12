import { getPractice, reviewEnabled } from "@/lib/practice";
import { PracticeBox } from "./PracticeBox";

/** Top-of-page nudge for case studies that have a practice exercise. */
export function PracticeNudge({ url }: { url: string }) {
  if (!getPractice(url)) return null;
  return (
    <p className="not-prose mb-6 rounded-lg border border-fd-border bg-fd-card px-4 py-3 text-sm">
      <span className="font-semibold">Interview practice:</span> try designing this yourself before reading.{" "}
      <a href="#practice" className="font-medium underline underline-offset-4">
        Go to the exercise ↓
      </a>
    </p>
  );
}

/** The exercise itself, at the end of the page. */
export function PracticeCase({ url }: { url: string }) {
  const found = getPractice(url);
  if (!found) return null;
  return <PracticeBox url={url} kind={found.kind} practice={found.practice} reviewEnabled={reviewEnabled()} />;
}
