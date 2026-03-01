import { Container } from "./Container";

export function Footer() {
    return (
        <footer className="border-t border-slate-200 py-12 text-slate-900 bg-slate-50">
            <Container className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                        Y
                    </div>
                    <span className="font-bold text-slate-800">YourSplit</span>
                </div>
                <div className="flex gap-8 text-sm font-semibold text-slate-500">
                    <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
                    <a href="#" className="hover:text-indigo-600 transition-colors">Contact Support</a>
                </div>
                <p className="text-sm text-slate-500">
                    &copy; {new Date().getFullYear()} YourSplit. All rights reserved.
                </p>
            </Container>
        </footer>
    );
}
