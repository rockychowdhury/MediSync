import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-soft-grey">
            <div className="text-center space-y-4 p-8">
                <h1 className="text-6xl font-extrabold text-gradient-primary">404</h1>
                <h2 className="text-2xl font-bold">Page Not Found</h2>
                <p className="text-muted-foreground max-w-md">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-white gradient-primary hover:gradient-primary-hover transition-all"
                >
                    Back to Home
                </Link>
            </div>
        </div>
    );
}
