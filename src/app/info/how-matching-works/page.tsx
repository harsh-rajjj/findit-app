import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function HowMatchingWorksPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">How Matching Works</h1>
        <p className="text-muted-foreground mt-2">
          FindIt compares lost and found reports to suggest likely matches. Here’s what it looks at and how you can
          improve results.
        </p>
      </div>

      <div className="grid gap-5">
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <h2 className="font-semibold text-lg">What we compare</h2>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="text-foreground font-medium">Category</span> (e.g. phone, laptop, keys)
              </li>
              <li>
                <span className="text-foreground font-medium">Title + description</span> (keywords like brand, color,
                model, size)
              </li>
              <li>
                <span className="text-foreground font-medium">Reported details</span> you provide (anything unique helps)
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <h2 className="font-semibold text-lg">Confidence score</h2>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              Matches are ranked by a confidence score. A higher score means the reports are more similar based on the
              available data.
            </p>
            <p>
              Tip: adding clear keywords (brand/model/color) usually improves match quality more than writing long text.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <h2 className="font-semibold text-lg">What to do when you find a match</h2>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              Open the report details and use the claim flow to verify ownership. Always avoid sharing sensitive
              information publicly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href="/matches">
                <Button className="gradient-primary text-white border-0">Go to Matches</Button>
              </Link>
              <Link href="/report/new?type=lost">
                <Button variant="outline">Create Lost Report</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

