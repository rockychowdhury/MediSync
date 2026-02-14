export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex">
            {/* Sidebar will be added here */}
            <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-border">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-deep-navy">MediSync</h2>
                </div>
                <nav className="flex-1 px-4 space-y-1">
                    {/* Navigation links will be added here */}
                </nav>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col">
                {/* Header will be added here */}
                <header className="h-16 border-b border-border bg-white flex items-center px-6">
                    <h3 className="text-lg font-semibold">Dashboard</h3>
                </header>

                <main className="flex-1 p-6 bg-soft-grey">{children}</main>
            </div>
        </div>
    );
}
