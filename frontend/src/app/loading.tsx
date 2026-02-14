export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-soft-grey">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-teal-blue border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground text-sm">Loading...</p>
            </div>
        </div>
    );
}
