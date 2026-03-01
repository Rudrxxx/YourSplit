import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-transparent text-slate-900 font-sans selection:bg-indigo-600/30 selection:text-slate-900">
      <main className="flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full pt-32 pb-24 px-6 text-center relative flex flex-col items-center animate-fade-in-up">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-indigo-600/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

          {/* Subtle 3D Floating Element */}
          <div className="hidden lg:block absolute right-[15%] top-[25%] -z-10 pointer-events-none">
            <div className="w-32 h-32 rounded-full border border-white bg-gradient-to-br from-white via-indigo-50 to-slate-200 shadow-[10px_20px_30px_-10px_rgba(79,70,229,0.2),inset_-10px_-10px_20px_rgba(0,0,0,0.05)] opacity-80 animate-[spin_15s_linear_infinite]" style={{ animationDirection: 'alternate' }}>
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.8),transparent_50%)]"></div>
            </div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-900/5 blur-md rounded-full"></div>
          </div>

          <div className="relative z-10 w-full flex flex-col items-center">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-500 bg-clip-text text-transparent max-w-4xl">
              Split Expenses Smarter.
            </h1>

            <p className="text-xl md:text-2xl text-slate-500 mb-12 max-w-2xl leading-relaxed">
              Track group expenses, visualize debt graphs, and settle with minimum transactions.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-semibold text-lg transition-all hover:shadow-[0_0_40px_8px_rgba(79,70,229,0.2)] hover:-translate-y-1">
                Get Started
              </Link>
              <Link href="#demo" className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-sm hover:shadow-md rounded-full font-semibold text-lg transition-all">
                View Demo
              </Link>
            </div>
          </div>
        </section>

        {/* Mock Debt Graph Preview */}
        <section className="w-full max-w-5xl px-6 mb-32 text-center pt-8 animate-fade-in-up animate-delay-100">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">See who owes whom instantly.</h2>
          <p className="text-slate-500 text-lg mb-12">Visualizing complex group debts has never been easier.</p>
          <div className="relative h-[400px] w-full bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.05)_0,transparent_100%)]"></div>

            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.6 }}>
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1" />
                </marker>
                <marker id="arrow-emerald" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                </marker>
                <marker id="arrow-pink" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#ec4899" />
                </marker>
              </defs>
              <line x1="25%" y1="25%" x2="50%" y2="50%" stroke="#6366f1" strokeWidth="2" strokeDasharray="4" markerEnd="url(#arrow)" />
              <line x1="75%" y1="25%" x2="50%" y2="50%" stroke="#10b981" strokeWidth="2.5" markerEnd="url(#arrow-emerald)" />
              <line x1="25%" y1="75%" x2="50%" y2="50%" stroke="#6366f1" strokeWidth="2" markerEnd="url(#arrow)" />
              <line x1="75%" y1="75%" x2="50%" y2="50%" stroke="#ec4899" strokeWidth="2" strokeDasharray="4" markerEnd="url(#arrow-pink)" />
              <line x1="25%" y1="25%" x2="75%" y2="25%" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4" markerEnd="url(#arrow)" />
            </svg>

            {/* Nodes */}
            <div className="absolute top-[25%] left-[25%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-pulse duration-3000">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center mb-2 shadow-sm">
                <span className="font-bold text-indigo-700 md:text-xl">Alex</span>
              </div>
            </div>

            <div className="absolute top-[25%] right-[25%] translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-2 shadow-sm">
                <span className="font-bold text-emerald-700 md:text-xl">Ben</span>
              </div>
            </div>

            <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 transition-transform duration-500 hover:scale-110 cursor-pointer">
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-indigo-600 border-4 border-white flex items-center justify-center mb-2 shadow-xl shadow-indigo-500/30 relative">
                <span className="font-bold text-white text-lg md:text-2xl">You</span>
                <div className="absolute -bottom-3 px-3 py-1 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full text-xs font-bold text-white whitespace-nowrap shadow-md">
                  Gets ₹450
                </div>
              </div>
            </div>

            <div className="absolute bottom-[25%] left-[25%] -translate-x-1/2 translate-y-1/2 flex flex-col items-center">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-pink-50 border border-pink-200 flex items-center justify-center mb-2 shadow-sm">
                <span className="font-bold text-pink-700 md:text-xl">Chloe</span>
              </div>
            </div>

            <div className="absolute bottom-[25%] right-[25%] translate-x-1/2 translate-y-1/2 flex flex-col items-center animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite]">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mb-2 shadow-sm">
                <span className="font-bold text-blue-700 md:text-xl">Dave</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full max-w-7xl px-6 py-24 border-t border-slate-200 animate-fade-in-up animate-delay-200">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything you need to manage group debt.</h2>
            <p className="text-slate-500 text-lg">Powerful features wrapped in a beautiful, intuitive interface.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Smart Splitting", desc: "Split bills equally, by exact amounts, or by percentages effortlessly.", icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
              { title: "Debt Graph Visualization", desc: "See exactly who owes who with an interactive, physics-based force graph.", icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" },
              { title: "Optimized Settlement", desc: "Our algorithm minimizes the total number of transactions needed to settle up.", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
              { title: "Activity Timeline", desc: "A unified, chronological feed of every expense added and payment made.", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" }
            ].map((feat, i) => (
              <div key={i} className="group relative bg-white border border-slate-200 p-8 rounded-xl overflow-hidden shadow-sm hover:border-indigo-300 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-100 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feat.icon} />
                  </svg>
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl font-semibold mb-2 text-slate-900 group-hover:text-indigo-600 transition-colors">{feat.title}</h3>
                  <p className="text-slate-500 leading-relaxed text-sm">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="w-full max-w-7xl px-6 py-24 animate-fade-in-up animate-delay-300">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-slate-500 text-lg">Three simple steps to financial peace of mind.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-indigo-200/0 via-indigo-200 to-indigo-200/0 -z-10"></div>

            {[
              { step: "1", title: "Create Group", desc: "Start a group for a trip, apartment, or event and invite your friends." },
              { step: "2", title: "Add Expenses", desc: "Log purchases as they happen. We'll keep a running tally of balances." },
              { step: "3", title: "Settle Instantly", desc: "Check the optimized payment plan and settle up with minimal transfers." }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-white border border-indigo-100 flex items-center justify-center text-3xl font-bold text-indigo-600 mb-6 shadow-sm shadow-indigo-500/5">
                  {item.step}
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-slate-900">{item.title}</h3>
                <p className="text-slate-500 text-lg max-w-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full max-w-5xl px-6 py-32 text-center animate-fade-in-up">
          <div className="bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-[2rem] p-[1px] relative overflow-hidden shadow-2xl shadow-indigo-500/20">
            <div className="bg-white rounded-[31px] px-8 py-16 md:py-24 relative overflow-hidden h-full w-full flex flex-col items-center justify-center">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none"></div>

              <h2 className="text-4xl md:text-6xl font-extrabold mb-6 relative z-10 tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Ready to Split Smarter?
              </h2>
              <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto relative z-10">
                Stop chasing friends for money. Start managing expenses effortlessly today.
              </p>
              <Link href="/dashboard" className="px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-full font-bold text-lg transition-all hover:shadow-lg hover:shadow-purple-500/25 hover:scale-105 active:scale-95 relative z-10 inline-flex items-center gap-2">
                Start Managing Expenses
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

