"use client";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-soft-grey">
            <div className="text-center space-y-4 p-8">
                <h2 className="text-2xl font-bold text-destructive">
                    Something went wrong
                </h2>
                <p className="text-muted-foreground">{error.message}</p>
                <button
                    onClick={reset}
                    className="px-6 py-2 rounded-lg text-white gradient-primary hover:gradient-primary-hover transition-all"
                >
                    Try Again
                </button>
            </div>
        </div>
    );
}
