export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`w-full max-w-7xl mx-auto px-6 ${className}`}>
            {children}
        </div>
    );
}
