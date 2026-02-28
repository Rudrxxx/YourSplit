"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface Balance {
    userId: string;
    name: string;
    balance: number;
}
interface BalanceData {
    groupId: string;
    totalExpenses: number;
    perPersonShare: number;
    balances: Balance[];
}
interface Settlement {
    from: string;
    to: string;
    amount: number;
}
interface SettlementData {
    groupId: string;
    settlements: Settlement[];
}

const defaultForm = { description: "", amount: "", paidById: "" };

function Spinner({ className = "" }: { className?: string }) {
    return (
        <svg
            className={`animate-spin ${className}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white shadow-lg animate-fade-in">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {message}
        </div>
    );
}

export default function GroupBalancesPage({
    params,
}: {
    params: Promise<{ groupId: string }>;
}) {
    const [groupId, setGroupId] = useState<string | null>(null);
    const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
    const [settlementData, setSettlementData] = useState<SettlementData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Expense modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState(defaultForm);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Member modal state
    const [memberModalOpen, setMemberModalOpen] = useState(false);
    const [memberForm, setMemberForm] = useState({ name: "", email: "" });
    const [memberSubmitting, setMemberSubmitting] = useState(false);
    const [memberFormError, setMemberFormError] = useState<string | null>(null);

    // Toast
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        params.then((p) => setGroupId(p.groupId));
    }, [params]);

    const fetchData = useCallback((id: string, isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);
        Promise.all([
            fetch(`/api/groups/${id}/balances`).then((r) => {
                if (!r.ok) throw new Error(`Balances: HTTP ${r.status}`);
                return r.json() as Promise<BalanceData>;
            }),
            fetch(`/api/groups/${id}/settlements`).then((r) => {
                if (!r.ok) throw new Error(`Settlements: HTTP ${r.status}`);
                return r.json() as Promise<SettlementData>;
            }),
        ])
            .then(([bal, set]) => {
                setBalanceData(bal);
                setSettlementData(set);
            })
            .catch((err) => setError(err.message))
            .finally(() => {
                setLoading(false);
                setRefreshing(false);
            });
    }, []);

    useEffect(() => {
        if (groupId) fetchData(groupId);
    }, [groupId, fetchData]);

    const openModal = () => {
        setForm({ ...defaultForm, paidById: balanceData?.balances[0]?.userId ?? "" });
        setFormError(null);
        setModalOpen(true);
    };

    const openMemberModal = () => {
        setMemberForm({ name: "", email: "" });
        setMemberFormError(null);
        setMemberModalOpen(true);
    };

    const handleMemberSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!groupId) return;
        const name = memberForm.name.trim();
        if (!name) { setMemberFormError("Name is required."); return; }
        setMemberSubmitting(true);
        setMemberFormError(null);
        try {
            // Step 1: create user (email is required by DB; generate placeholder if blank)
            const email = memberForm.email.trim()
                || `${name.toLowerCase().replace(/\s+/g, ".")}@yoursplit.local`;
            const userRes = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email }),
            });
            if (!userRes.ok) {
                const body = await userRes.json().catch(() => ({}));
                throw new Error(body.error ?? `Users API: HTTP ${userRes.status}`);
            }
            const user = await userRes.json();

            // Step 2: add to group
            const memberRes = await fetch("/api/group-members", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ groupId, userId: user.id }),
            });
            if (!memberRes.ok) {
                const body = await memberRes.json().catch(() => ({}));
                throw new Error(body.error ?? `Group-members API: HTTP ${memberRes.status}`);
            }

            setMemberModalOpen(false);
            setToast(`${name} added to group`);
            fetchData(groupId, true);
        } catch (err: unknown) {
            setMemberFormError(err instanceof Error ? err.message : "Failed to add member");
        } finally {
            setMemberSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!groupId) return;
        const amt = parseFloat(form.amount);
        if (!form.description.trim() || isNaN(amt) || amt <= 0 || !form.paidById) {
            setFormError("Please fill in all fields with valid values.");
            return;
        }
        setSubmitting(true);
        setFormError(null);
        try {
            const res = await fetch("/api/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    description: form.description.trim(),
                    amount: amt,
                    paidById: form.paidById,
                    groupId,
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error ?? `HTTP ${res.status}`);
            }
            setModalOpen(false);
            setToast(`"${form.description.trim()}" added successfully`);
            fetchData(groupId, true); // refresh without full skeleton
        } catch (err: unknown) {
            setFormError(err instanceof Error ? err.message : "Failed to add expense");
        } finally {
            setSubmitting(false);
        }
    };

    const balanceColor = (b: number) =>
        b > 0 ? "text-emerald-400" : b < 0 ? "text-red-400" : "text-gray-500";
    const balanceLabel = (b: number) =>
        b > 0
            ? `gets back ₹${b.toFixed(2)}`
            : b < 0
                ? `owes ₹${Math.abs(b).toFixed(2)}`
                : "settled up";

    return (
        <>
            {/* Toast */}
            {toast && <Toast message={toast} onDone={() => setToast(null)} />}

            <main className="min-h-screen bg-gray-950 text-white px-6 py-10">
                <div className="max-w-2xl mx-auto">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-8"
                    >
                        ← Back to groups
                    </Link>

                    {/* Initial loading skeleton */}
                    {loading && (
                        <div className="space-y-4">
                            <div className="h-8 w-48 rounded-lg bg-gray-800 animate-pulse" />
                            <div className="h-28 rounded-xl bg-gray-800 animate-pulse" />
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-16 rounded-xl bg-gray-800 animate-pulse" />
                            ))}
                        </div>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <div className="rounded-xl border border-red-800 bg-red-950/40 px-5 py-4 text-red-300 text-sm">
                            Failed to load group: {error}
                        </div>
                    )}

                    {/* Content — shown immediately, dims while refreshing */}
                    {!loading && !error && balanceData && settlementData && (
                        <div className={`transition-opacity duration-200 ${refreshing ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
                            {/* Header */}
                            <div className="flex items-start justify-between mb-8">
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight">Group Balances</h1>
                                    <p className="text-xs text-gray-600 mt-1 font-mono">{balanceData.groupId}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={openMemberModal}
                                        disabled={refreshing}
                                        className="flex items-center gap-1.5 rounded-lg border border-gray-700 hover:border-gray-500 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 transition-colors px-4 py-2 text-sm font-medium text-gray-300"
                                    >
                                        + Add Member
                                    </button>
                                    <button
                                        onClick={openModal}
                                        disabled={refreshing}
                                        className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 transition-colors px-4 py-2 text-sm font-medium text-white"
                                    >
                                        {refreshing ? <Spinner className="w-4 h-4" /> : null}
                                        + Add Expense
                                    </button>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="rounded-xl border border-gray-800 bg-gray-900 px-5 py-5 mb-6 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Total Expenses</p>
                                    <p className="text-2xl font-semibold">₹{balanceData.totalExpenses.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Per Person</p>
                                    <p className="text-2xl font-semibold">₹{balanceData.perPersonShare.toFixed(2)}</p>
                                </div>
                            </div>

                            {/* No expenses empty state OR member/settlement sections */}
                            {balanceData.totalExpenses === 0 ? (
                                <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-900/50 px-8 py-14 text-center">
                                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-gray-700 bg-gray-800 text-2xl">
                                        💸
                                    </div>
                                    <h2 className="text-base font-semibold text-white mb-1">No expenses yet</h2>
                                    <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                        Add the first expense to start tracking who owes what.
                                    </p>
                                    <button
                                        onClick={openModal}
                                        className="mt-5 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors px-4 py-2 text-sm font-medium text-white"
                                    >
                                        + Add First Expense
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Members</p>
                                    <ul className="space-y-3 mb-8">
                                        {balanceData.balances.map((member) => (
                                            <li
                                                key={member.userId}
                                                className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 px-5 py-4"
                                            >
                                                <div>
                                                    <p className="font-medium text-white">{member.name}</p>
                                                    <p className={`text-sm mt-0.5 ${balanceColor(member.balance)}`}>
                                                        {balanceLabel(member.balance)}
                                                    </p>
                                                </div>
                                                <span className={`text-lg font-semibold tabular-nums ${balanceColor(member.balance)}`}>
                                                    {member.balance > 0 ? "+" : ""}₹{member.balance.toFixed(2)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Settlement Plan</p>
                                    {settlementData.settlements.length === 0 ? (
                                        <div className="rounded-xl border border-gray-800 bg-gray-900 px-5 py-6 text-center text-gray-500 text-sm">
                                            ✓ All settled up
                                        </div>
                                    ) : (
                                        <ul className="space-y-3">
                                            {settlementData.settlements.map((s, i) => (
                                                <li
                                                    key={i}
                                                    className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 px-5 py-4"
                                                >
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="font-medium text-red-400">{s.from}</span>
                                                        <span className="text-gray-600">→</span>
                                                        <span className="font-medium text-emerald-400">{s.to}</span>
                                                    </div>
                                                    <span className="text-white font-semibold tabular-nums">
                                                        ₹{s.amount.toFixed(2)}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Modal */}
            {modalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
                    onClick={(e) => e.target === e.currentTarget && !submitting && setModalOpen(false)}
                >
                    <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold">Add Expense</h2>
                            <button
                                onClick={() => !submitting && setModalOpen(false)}
                                className="text-gray-500 hover:text-gray-300 transition-colors text-xl leading-none disabled:opacity-40"
                                disabled={submitting}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">Description</label>
                                <input
                                    type="text"
                                    value={form.description}
                                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                    placeholder="Hotel, dinner, tickets…"
                                    disabled={submitting}
                                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none transition-colors disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">Amount (₹)</label>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={form.amount}
                                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                                    placeholder="0.00"
                                    disabled={submitting}
                                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none transition-colors disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">Paid by</label>
                                <select
                                    value={form.paidById}
                                    onChange={(e) => setForm((f) => ({ ...f, paidById: e.target.value }))}
                                    disabled={submitting}
                                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors disabled:opacity-50"
                                >
                                    {balanceData?.balances.map((m) => (
                                        <option key={m.userId} value={m.userId}>{m.name}</option>
                                    ))}
                                </select>
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
                                    {submitting ? "Adding…" : "Add Expense"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            {memberModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
                    onClick={(e) => e.target === e.currentTarget && !memberSubmitting && setMemberModalOpen(false)}
                >
                    <div className="w-full max-w-sm rounded-2xl border border-gray-800 bg-gray-900 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold">Add Member</h2>
                            <button
                                onClick={() => !memberSubmitting && setMemberModalOpen(false)}
                                disabled={memberSubmitting}
                                className="text-gray-500 hover:text-gray-300 transition-colors text-xl leading-none disabled:opacity-40"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleMemberSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">Name</label>
                                <input
                                    type="text"
                                    value={memberForm.name}
                                    onChange={(e) => setMemberForm((f) => ({ ...f, name: e.target.value }))}
                                    placeholder="Jane Doe"
                                    disabled={memberSubmitting}
                                    autoFocus
                                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none transition-colors disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">
                                    Email <span className="normal-case text-gray-600">(optional)</span>
                                </label>
                                <input
                                    type="email"
                                    value={memberForm.email}
                                    onChange={(e) => setMemberForm((f) => ({ ...f, email: e.target.value }))}
                                    placeholder="jane@example.com"
                                    disabled={memberSubmitting}
                                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none transition-colors disabled:opacity-50"
                                />
                            </div>

                            {memberFormError && <p className="text-red-400 text-xs">{memberFormError}</p>}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setMemberModalOpen(false)}
                                    disabled={memberSubmitting}
                                    className="flex-1 rounded-lg border border-gray-700 py-2.5 text-sm text-gray-400 hover:border-gray-500 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={memberSubmitting}
                                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors py-2.5 text-sm font-medium text-white"
                                >
                                    {memberSubmitting && <Spinner className="w-4 h-4" />}
                                    {memberSubmitting ? "Adding…" : "Add Member"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
