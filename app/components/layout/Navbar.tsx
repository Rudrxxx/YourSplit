import Link from "next/link";
import { Container } from "./Container";

export function Navbar() {
    return (
        <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
            <Container className="h-16 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-900">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm shadow-indigo-500/20">
                        Y
                    </div>
                    <span className="font-bold text-lg tracking-tight">YourSplit</span>
                </div>

                <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
                    <Link href="/#features" className="hover:text-indigo-600 transition-colors">Features</Link>
                    <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
                </div>

                <div className="flex items-center gap-4">
                    {/* Placeholder for future Auth Button (e.g. Clerk/NextAuth UserButton) */}
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden hover:bg-slate-200 cursor-pointer transition-colors">
                        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                </div>
            </Container>
        </nav>
    );
}
