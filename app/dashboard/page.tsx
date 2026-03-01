"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface Group {
    id: string;
    name: string;
    createdAt: string;
}

function Spinner({ className = "" }: { className?: string }) {
    return (
        <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
        </svg>
    );
}

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
    useEffect(() => {
        const t = setTimeout(onDone, 3000);
        return () => clearTimeout(t);
    }, [onDone]);
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white shadow-lg">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {message}
        </div>
    );
}

export default function DashboardPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Toast
    const [toast, setToast] = useState<string | null>(null);

    const fetchGroups = useCallback((isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);
        fetch("/api/groups")
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((data) => setGroups(data))
            .catch((err) => setError(err.message))
            .finally(() => {
                setLoading(false);
                setRefreshing(false);
            });
    }, []);

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    const handleCreateGroup = () => {
        setGroupName("");
        setFormError(null);
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const name = groupName.trim();
        if (!name) { setFormError("Group name is required."); return; }
        setSubmitting(true);
        setFormError(null);
        try {
            const res = await fetch("/api/groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error ?? `HTTP ${res.status}`);
            }
            setModalOpen(false);
            setToast(`"${name}" created`);
            fetchGroups(true);
        } catch (err: unknown) {
            setFormError(err instanceof Error ? err.message : "Failed to create group");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-transparent text-slate-900 px-6">
            {toast && <Toast message={toast} onDone={() => setToast(null)} />}

            <div className="max-w-2xl mx-auto py-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Welcome back.</h1>
                        <p className="text-slate-500 mt-2 text-base font-medium">Manage your active groups and balances.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/me"
                            className="px-4 py-2 border border-slate-200 bg-white text-slate-700 shadow-sm text-sm font-semibold rounded-xl hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition"
                        >
                            Your Balances
                        </Link>
                        <button
                            onClick={handleCreateGroup}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl font-medium transition-all shadow-sm hover:shadow-md active:scale-95 text-sm flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Create Group
                        </button>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                        <Spinner className="w-8 h-8 text-indigo-500 mb-4" />
                        <p className="text-sm font-medium animate-pulse">Loading groups…</p>
                    </div>
                ) : error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center shadow-sm">
                        <svg className="mx-auto h-8 w-8 text-red-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-red-600 font-medium mb-4">{error}</p>
                        <button
                            onClick={() => fetchGroups(false)}
                            className="px-4 py-2 bg-white border border-red-200 text-red-600 shadow-sm hover:bg-red-50 rounded-lg text-sm font-medium transition"
                        >
                            Try Again
                        </button>
                    </div>
                ) : groups.length === 0 ? (
                    <div className="text-center py-24 border border-indigo-100 rounded-3xl bg-white w-full flex flex-col items-center shadow-md relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent"></div>
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 border border-indigo-100 shadow-sm">
                            <svg className="w-10 h-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">No groups yet</h3>
                        <p className="text-slate-500 mb-8 max-w-sm text-base leading-relaxed">Create a group to start adding expenses and splitting bills effortlessly with your friends.</p>
                        <button
                            onClick={handleCreateGroup}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-full font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.2)] hover:shadow-[0_0_25px_rgba(79,70,229,0.3)] active:scale-95 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Create your first group
                        </button>
                    </div>
                ) : (
                    <ul className="space-y-3 relative">
                        {refreshing && (
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                                <Spinner className="w-5 h-5 text-indigo-500" />
                            </div>
                        )}
                        {groups.map((g) => (
                            <li key={g.id}>
                                <Link
                                    href={`/dashboard/groups/${g.id}`}
                                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-slate-200 bg-white hover:border-indigo-300 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1"
                                >
                                    <div>
                                        <h3 className="font-bold text-xl text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">{g.name}</h3>
                                        <p className="text-slate-500 text-xs mt-1.5 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Created {new Date(g.createdAt).toLocaleDateString(undefined, {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            }).toUpperCase()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 group-hover:bg-indigo-50 text-slate-400 group-hover:text-indigo-600 border border-slate-100 group-hover:border-indigo-100 transition-all duration-300">
                                            <svg className="w-5 h-5 translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </span>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Create Group Modal */}
            {modalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4"
                    onClick={(e) => e.target === e.currentTarget && !submitting && setModalOpen(false)}
                >
                    <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Create Group</h2>
                            <button
                                onClick={() => !submitting && setModalOpen(false)}
                                disabled={submitting}
                                className="text-slate-400 hover:text-slate-600 transition-colors text-2xl leading-none disabled:opacity-40"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                                    Group Name
                                </label>
                                <input
                                    type="text"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    placeholder="Goa Trip, Flatmates, Bali 2025…"
                                    disabled={submitting}
                                    autoFocus
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all disabled:bg-slate-50 disabled:opacity-50"
                                />
                            </div>

                            {formError && <p className="text-red-500 text-xs font-semibold">{formError}</p>}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    disabled={submitting}
                                    className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors py-3 text-sm font-bold text-white"
                                >
                                    {submitting && <Spinner className="w-4 h-4" />}
                                    {submitting ? "Creating…" : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}

