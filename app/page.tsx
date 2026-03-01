import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-50 font-sans selection:bg-indigo-500/30">
      {/* Navigation */}
      <nav className="border-b border-white/5 bg-gray-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              Y
            </div>
            <span className="font-semibold text-lg tracking-tight">YourSplit</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium bg-white text-gray-900 px-4 py-2 rounded-full hover:bg-gray-200 transition-all hover:scale-105 active:scale-95">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full pt-32 pb-24 px-6 text-center relative overflow-hidden flex flex-col items-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 bg-gradient-to-br from-white via-white to-gray-500 bg-clip-text text-transparent max-w-4xl">
            Split Expenses Smarter.
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl leading-relaxed">
            Track group expenses, visualize debt graphs, and settle with minimum transactions.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link href="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-semibold text-lg transition-all hover:shadow-[0_0_40px_8px_rgba(79,70,229,0.3)] hover:-translate-y-1">
              Get Started
            </Link>
            <Link href="#demo" className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full font-semibold text-lg transition-all backdrop-blur-sm">
              View Demo
            </Link>
          </div>
        </section>

        {/* Visual Preview Placeholder */}
        <section id="demo" className="w-full max-w-6xl px-6 mb-32 relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-20"></div>
          <div className="relative aspect-[16/9] bg-gray-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center group overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
            <div className="flex flex-col items-center gap-4 z-10">
              <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 group-hover:scale-110 transition-transform duration-500 cursor-pointer">
                <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-400 font-medium tracking-widest uppercase text-sm">Interactive Graph Preview</p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full max-w-7xl px-6 py-24 border-t border-white/5">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything you need to manage group debt.</h2>
            <p className="text-gray-400 text-lg">Powerful features wrapped in a beautiful, intuitive interface.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Smart Splitting", desc: "Split bills equally, by exact amounts, or by percentages effortlessly.", icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
              { title: "Debt Graph Visualization", desc: "See exactly who owes who with an interactive, physics-based force graph.", icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" },
              { title: "Optimized Settlement", desc: "Our algorithm minimizes the total number of transactions needed to settle up.", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
              { title: "Activity Timeline", desc: "A unified, chronological feed of every expense added and payment made.", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" }
            ].map((feat, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-2xl hover:bg-white/[0.04] transition-all hover:-translate-y-1">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6 border border-indigo-500/20">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feat.icon} />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">{feat.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="w-full max-w-7xl px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-400 text-lg">Three simple steps to financial peace of mind.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-indigo-500/0 via-indigo-500/20 to-indigo-500/0 -z-10"></div>

            {[
              { step: "1", title: "Create Group", desc: "Start a group for a trip, apartment, or event and invite your friends." },
              { step: "2", title: "Add Expenses", desc: "Log purchases as they happen. We'll keep a running tally of balances." },
              { step: "3", title: "Settle Instantly", desc: "Check the optimized payment plan and settle up with minimal transfers." }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-gray-900 border border-indigo-500/30 flex items-center justify-center text-3xl font-bold text-indigo-400 mb-6 shadow-[0_0_30px_rgba(79,70,229,0.1)]">
                  {item.step}
                </div>
                <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
                <p className="text-gray-400 text-lg max-w-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full max-w-5xl px-6 py-24 text-center">
          <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/20 rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/30 rounded-full blur-[80px]"></div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 relative z-10">Ready to stop doing math?</h2>
            <p className="text-xl text-indigo-200/80 mb-10 max-w-2xl mx-auto relative z-10">
              Join thousands of users who are settling their group debts up to 80% faster with advanced optimization.
            </p>
            <Link href="/dashboard" className="px-8 py-4 bg-white text-gray-950 hover:bg-gray-200 rounded-full font-bold text-lg transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] relative z-10 inline-block">
              Get Started for Free
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-80">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs">
              Y
            </div>
            <span className="font-semibold text-gray-300">YourSplit</span>
          </div>
          <div className="flex gap-8 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact Support</a>
          </div>
          <p className="text-sm text-gray-600">
            &copy; {new Date().getFullYear()} YourSplit. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

