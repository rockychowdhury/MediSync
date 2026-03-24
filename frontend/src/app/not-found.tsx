import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="rounded-full bg-primary/10 p-4">
        <FileQuestion className="h-10 w-10 text-primary" />
      </div>
      <div>
        <h1 className="text-6xl font-bold text-gradient-primary font-heading">
          404
        </h1>
        <h2 className="mt-2 text-xl font-semibold text-foreground">
          Page Not Found
        </h2>
        <p className="mt-2 text-muted-foreground max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/dashboard">
          <Button className="gradient-primary text-white">
            Go to Dashboard
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline">Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
