import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DtiCapstoneProjectPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">DTI Capstone Project</h1>
        <p className="text-muted-foreground mt-2">
          FindIt is built as a capstone project to demonstrate a full-stack, production-style lost &amp; found platform.
        </p>
      </div>

      <div className="grid gap-5">
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <h2 className="font-semibold text-lg">Project goals</h2>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <ul className="list-disc pl-5 space-y-2">
              <li>Help people report lost/found items quickly</li>
              <li>Use matching to reduce manual searching</li>
              <li>Enable safe claiming and communication</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <h2 className="font-semibold text-lg">Tech overview</h2>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <ul className="list-disc pl-5 space-y-2">
              <li>Next.js App Router UI</li>
              <li>NextAuth authentication</li>
              <li>PostgreSQL + Drizzle ORM</li>
              <li>Supabase storage/services (as configured)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

