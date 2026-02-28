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
            .finally(() => { setLoading(false); setRefreshing(false); });
    }, []);

    useEffect(() => { fetchGroups(); }, [fetchGroups]);

    const openModal = () => {
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
        <>
            {toast && <Toast message={toast} onDone={() => setToast(null)} />}

            <main className="min-h-screen bg-gray-950 text-white px-6 py-10">
                <div className="max-w-2xl mx-auto">

                    {/* Header */}
                    <div className="flex items-start justify-between mb-10">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">YourSplit</h1>
                            <p className="text-gray-400 mt-1 text-sm font-medium">Your active groups</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/me"
                                className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900 hover:bg-gray-800 transition-colors px-4 py-2 text-sm font-medium text-gray-300"
                            >
                                Personal Overview
                            </Link>
                            <button
                                onClick={openModal}
                                disabled={refreshing}
                                className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 transition-colors px-4 py-2 text-sm font-medium text-white"
                            >
                                {refreshing ? <Spinner className="w-4 h-4" /> : null}
                                + Create Group
                            </button>
                        </div>
                    </div>

                    {/* Loading */}
                    {loading && (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-16 rounded-xl bg-gray-800 animate-pulse" />
                            ))}
                        </div>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <div className="rounded-xl border border-red-800 bg-red-950/40 px-5 py-4 text-red-300 text-sm">
                            Failed to load groups: {error}
                        </div>
                    )}

                    {/* Group list with refreshing dim */}
                    {!loading && !error && (
                        <div className={`transition-opacity duration-200 ${refreshing ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
                            {/* Empty — CTA */}
                            {groups.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-900/50 px-8 py-14 text-center">
                                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-gray-700 bg-gray-800 text-2xl">
                                        🧾
                                    </div>
                                    <h2 className="text-base font-semibold text-white mb-1">No groups yet</h2>
                                    <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                        Create a group to start splitting expenses with friends.
                                    </p>
                                    <button
                                        onClick={openModal}
                                        className="mt-5 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors px-4 py-2 text-sm font-medium text-white"
                                    >
                                        + Create First Group
                                    </button>
                                </div>
                            )}

                            {/* Group list */}
                            {groups.length > 0 && (
                                <ul className="space-y-4">
                                    {groups.map((group) => (
                                        <li key={group.id} className="group relative">
                                            {/* Glow effect behind card on hover */}
                                            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-indigo-500/0 opacity-0 group-hover:from-indigo-500/20 group-hover:via-indigo-500/10 group-hover:to-purple-500/20 group-hover:opacity-100 blur transition duration-500"></div>

                                            <Link
                                                href={`/dashboard/groups/${group.id}`}
                                                className="relative flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/80 px-6 py-5 hover:border-indigo-500/50 hover:bg-gray-800/80 hover:-translate-y-0.5 transition-all duration-300 shadow-sm hover:shadow-indigo-500/10"
                                            >
                                                <div>
                                                    <p className="font-semibold text-lg text-white group-hover:text-indigo-400 transition-colors">
                                                        {group.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1 font-medium tracking-wide">
                                                        CREATED {new Date(group.createdAt).toLocaleDateString("en-IN", {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                        }).toUpperCase()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 group-hover:bg-indigo-600/20 text-gray-400 group-hover:text-indigo-400 transition-all duration-300">
                                                        <svg className="w-4 h-4 translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
                    )}
                </div>
            </main>

            {/* Create Group Modal */}
            {modalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
                    onClick={(e) => e.target === e.currentTarget && !submitting && setModalOpen(false)}
                >
                    <div className="w-full max-w-sm rounded-2xl border border-gray-800 bg-gray-900 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold">Create Group</h2>
                            <button
                                onClick={() => !submitting && setModalOpen(false)}
                                disabled={submitting}
                                className="text-gray-500 hover:text-gray-300 transition-colors text-xl leading-none disabled:opacity-40"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">
                                    Group Name
                                </label>
                                <input
                                    type="text"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    placeholder="Goa Trip, Flatmates, Bali 2025…"
                                    disabled={submitting}
                                    autoFocus
                                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none transition-colors disabled:opacity-50"
                                />
                            </div>

                            {formError && <p className="text-red-400 text-xs">{formError}</p>}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    disabled={submitting}
                                    className="flex-1 rounded-lg border border-gray-700 py-2.5 text-sm text-gray-400 hover:border-gray-500 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors py-2.5 text-sm font-medium text-white"
                                >
                                    {submitting && <Spinner className="w-4 h-4" />}
                                    {submitting ? "Creating…" : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
