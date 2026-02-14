export default function PublicPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-soft-grey">
            <div className="text-center space-y-6 p-8">
                <h1 className="text-5xl font-extrabold text-gradient-primary">
                    MediSync
                </h1>
                <p className="text-lg text-muted-foreground max-w-md mx-auto font-body">
                    Smart queue management and appointment scheduling for healthcare
                    facilities.
                </p>
                <div className="flex gap-4 justify-center">
                    <a
                        href="/login"
                        className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold text-white gradient-primary hover:gradient-primary-hover transition-all shadow-md"
                    >
                        Get Started
                    </a>
                </div>
            </div>
        </main>
    );
}
