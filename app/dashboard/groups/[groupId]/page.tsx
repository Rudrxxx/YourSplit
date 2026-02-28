"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useMemo } from "react";

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

interface ActivityLog {
    id: string;
    groupId: string;
    type: string;
    message: string;
    createdAt: string;
}

interface Expense {
    id: string;
    description: string;
    amount: number;
    groupId: string;
    createdAt: string;
    paidById: string;
    paidBy: { id: string; name: string };
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
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activities, setActivities] = useState<ActivityLog[]>([]);

    // Expense modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState(defaultForm);
    const [submitting, setSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<{
        description?: string; amount?: string; paidById?: string; server?: string;
    }>({});

    // Member modal state
    const [memberModalOpen, setMemberModalOpen] = useState(false);
    const [memberForm, setMemberForm] = useState({ name: "", email: "" });
    const [memberSubmitting, setMemberSubmitting] = useState(false);
    const [memberFormError, setMemberFormError] = useState<string | null>(null);

    // Settlement modal state
    const [settlementModalOpen, setSettlementModalOpen] = useState(false);
    const [settlementForm, setSettlementForm] = useState({ fromUserId: "", toUserId: "", amount: "" });
    const [settlementSubmitting, setSettlementSubmitting] = useState(false);
    const [settlementFieldErrors, setSettlementFieldErrors] = useState<{
        fromUserId?: string; toUserId?: string; amount?: string; server?: string;
    }>({});

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
            fetch(`/api/expenses`).then((r) => {
                if (!r.ok) throw new Error(`Expenses: HTTP ${r.status}`);
                return r.json() as Promise<Expense[]>;
            }),
            fetch(`/api/groups/${id}/activity`).then((r) => {
                if (!r.ok) throw new Error(`Activities: HTTP ${r.status}`);
                return r.json() as Promise<ActivityLog[]>;
            }),
        ])
            .then(([bal, set, exps, acts]) => {
                setBalanceData(bal);
                setSettlementData(set);
                setActivities(acts);
                // Filter client-side (backend returns all expenses unfiltered)
                setExpenses(
                    exps
                        .filter((e) => e.groupId === id)
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                );
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

    const analytics = useMemo(() => {
        const totals: Record<string, { name: string; amount: number }> = {};
        expenses.forEach((exp) => {
            if (!totals[exp.paidById]) {
                totals[exp.paidById] = { name: exp.paidBy?.name || "Unknown", amount: 0 };
            }
            totals[exp.paidById].amount += exp.amount;
        });
        const leaderboard = Object.values(totals).sort((a, b) => b.amount - a.amount);
        return {
            leaderboard,
            topContributor: leaderboard.length > 0 ? leaderboard[0] : null,
        };
    }, [expenses]);

    const openModal = () => {
        setForm({ ...defaultForm, paidById: balanceData?.balances[0]?.userId ?? "" });
        setFieldErrors({});
        setModalOpen(true);
    };

    const openMemberModal = () => {
        setMemberForm({ name: "", email: "" });
        setMemberFormError(null);
        setMemberModalOpen(true);
    };

    const openSettlementModal = () => {
        setSettlementForm({ fromUserId: "", toUserId: "", amount: "" });
        setSettlementFieldErrors({});
        setSettlementModalOpen(true);
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

        // Per-field validation
        const amt = parseFloat(form.amount);
        const errs: { description?: string; amount?: string; paidById?: string } = {};
        if (!form.description.trim()) errs.description = "Description is required.";
        if (!form.amount || isNaN(amt) || amt <= 0) errs.amount = "Enter a valid amount greater than 0.";
        if (!form.paidById) errs.paidById = "Select who paid.";
        if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

        setSubmitting(true);
        setFieldErrors({});
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
            setForm(defaultForm);  // explicit clear
            setToast(`"${form.description.trim()}" added successfully`);
            fetchData(groupId, true);
        } catch (err: unknown) {
            setFieldErrors({ server: err instanceof Error ? err.message : "Failed to add expense" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleSettlementSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!groupId) return;

        const amt = parseFloat(settlementForm.amount);
        const errs: { fromUserId?: string; toUserId?: string; amount?: string } = {};

        if (!settlementForm.fromUserId) errs.fromUserId = "Select who paid.";
        if (!settlementForm.toUserId) errs.toUserId = "Select who received the payment.";
        if (settlementForm.fromUserId && settlementForm.toUserId && settlementForm.fromUserId === settlementForm.toUserId) {
            errs.toUserId = "Payer and receiver cannot be the same person.";
        }
        if (!settlementForm.amount || isNaN(amt) || amt <= 0) errs.amount = "Enter a valid amount greater than 0.";

        if (Object.keys(errs).length > 0) {
            setSettlementFieldErrors(errs);
            return;
        }

        setSettlementSubmitting(true);
        setSettlementFieldErrors({});

        try {
            const res = await fetch("/api/settlements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    groupId,
                    fromUserId: settlementForm.fromUserId,
                    toUserId: settlementForm.toUserId,
                    amount: amt,
                }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error ?? `HTTP ${res.status}`);
            }

            setSettlementModalOpen(false);
            setSettlementForm({ fromUserId: "", toUserId: "", amount: "" });
            setToast(`Payment recorded successfully!`);
            fetchData(groupId, true);
        } catch (err: unknown) {
            setSettlementFieldErrors({ server: err instanceof Error ? err.message : "Failed to record payment" });
        } finally {
            setSettlementSubmitting(false);
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
                                <div className="flex flex-wrap items-center justify-end gap-2">
                                    <a
                                        href={`/api/groups/${groupId}/export`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900 hover:bg-gray-800 py-2 px-4 text-sm font-medium text-gray-300 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Export
                                    </a>
                                    <button
                                        onClick={openMemberModal}
                                        disabled={refreshing}
                                        className="rounded-lg border border-gray-700 bg-gray-800 hover:bg-gray-700 py-2 px-4 text-sm font-medium text-white transition-colors disabled:opacity-50"
                                    >
                                        + Add Member
                                    </button>
                                    <button
                                        onClick={openSettlementModal}
                                        disabled={refreshing}
                                        className="rounded-lg border border-gray-700 bg-gray-800 hover:bg-gray-700 py-2 px-4 text-sm font-medium text-white transition-colors disabled:opacity-50"
                                    >
                                        Record Payment
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

                            {/* Insights strip */}
                            <div className="rounded-xl border border-gray-800 bg-gray-900/60 px-5 py-4 mb-6 grid grid-cols-3 divide-x divide-gray-800">
                                <div className="pr-4">
                                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-0.5">Members</p>
                                    <p className="text-lg font-semibold">{balanceData.balances.length}</p>
                                </div>
                                <div className="px-4">
                                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-0.5">Expenses</p>
                                    <p className="text-lg font-semibold">{expenses.length}</p>
                                </div>
                                <div className="pl-4">
                                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-0.5">Last Expense</p>
                                    <p className="text-lg font-semibold">
                                        {expenses.length > 0
                                            ? new Date(expenses[0].createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                                            : "—"}
                                    </p>
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
                                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Contributor Analytics</p>
                                    <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden mb-8">
                                        {analytics.topContributor && (
                                            <div className="bg-indigo-900/40 border-b border-indigo-500/30 px-5 py-4 flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-indigo-400 font-medium uppercase tracking-wider mb-0.5">Top Contributor 👑</p>
                                                    <p className="text-white font-semibold text-lg">{analytics.topContributor.name}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-indigo-300/80 mb-0.5">Total Spent</p>
                                                    <p className="text-indigo-400 font-bold text-xl">₹{analytics.topContributor.amount.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        )}
                                        <ul className="divide-y divide-gray-800">
                                            {analytics.leaderboard.map((user, idx) => (
                                                <li key={idx} className="flex items-center justify-between px-5 py-3 bg-gray-900/80">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm text-gray-500 font-medium w-4">{idx + 1}.</span>
                                                        <span className="text-gray-200">{user.name}</span>
                                                    </div>
                                                    <span className="text-white font-medium">₹{user.amount.toFixed(2)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

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

                            {/* Expense History */}
                            <p className="text-xs text-gray-500 uppercase tracking-widest mb-3 mt-8">Expense History</p>
                            {expenses.length === 0 ? (
                                <div className="rounded-xl border border-gray-800 bg-gray-900 px-5 py-6 text-center text-gray-500 text-sm">
                                    No expenses recorded yet.
                                </div>
                            ) : (
                                <ul className="space-y-3">
                                    {expenses.map((exp) => (
                                        <li
                                            key={exp.id}
                                            className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 px-5 py-4"
                                        >
                                            <div className="min-w-0">
                                                <p className="font-medium text-white truncate">{exp.description}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    Paid by <span className="text-gray-400">{exp.paidBy.name}</span>
                                                    {" · "}
                                                    {new Date(exp.createdAt).toLocaleDateString("en-IN", {
                                                        day: "numeric", month: "short", year: "numeric",
                                                    })}
                                                </p>
                                            </div>
                                            <span className="ml-4 text-white font-semibold tabular-nums shrink-0">
                                                ₹{Number(exp.amount).toFixed(2)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {/* Activity Timeline */}
                            <p className="text-xs text-gray-500 uppercase tracking-widest mb-4 mt-10">Activity Timeline</p>
                            {activities.length === 0 ? (
                                <div className="rounded-xl border border-gray-800 bg-gray-900 px-5 py-6 text-center text-gray-500 text-sm">
                                    No activity yet.
                                </div>
                            ) : (
                                <div className="relative border-l border-gray-800 ml-3 space-y-6 pb-4">
                                    {activities.map((act) => (
                                        <div key={act.id} className="relative pl-6">
                                            <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-indigo-500 ring-4 ring-gray-950"></span>
                                            <p className="text-sm text-gray-200">{act.message}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(act.createdAt).toLocaleString("en-IN", {
                                                    day: "numeric", month: "short", hour: "numeric", minute: "2-digit"
                                                })}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Expense Modal */}
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
                                <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.description}
                                    onChange={(e) => {
                                        setForm((f) => ({ ...f, description: e.target.value }));
                                        if (fieldErrors.description) setFieldErrors((fe) => ({ ...fe, description: undefined }));
                                    }}
                                    placeholder="Hotel, dinner, tickets…"
                                    disabled={submitting}
                                    autoFocus
                                    className={`w-full rounded-lg border bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors disabled:opacity-50 ${fieldErrors.description ? "border-red-500 focus:border-red-400" : "border-gray-700 focus:border-indigo-500"
                                        }`}
                                />
                                {fieldErrors.description && <p className="mt-1 text-xs text-red-400">{fieldErrors.description}</p>}
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">
                                    Amount (₹) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={form.amount}
                                    onChange={(e) => {
                                        setForm((f) => ({ ...f, amount: e.target.value }));
                                        if (fieldErrors.amount) setFieldErrors((fe) => ({ ...fe, amount: undefined }));
                                    }}
                                    placeholder="0.00"
                                    disabled={submitting}
                                    className={`w-full rounded-lg border bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors disabled:opacity-50 ${fieldErrors.amount ? "border-red-500 focus:border-red-400" : "border-gray-700 focus:border-indigo-500"
                                        }`}
                                />
                                {fieldErrors.amount && <p className="mt-1 text-xs text-red-400">{fieldErrors.amount}</p>}
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">
                                    Paid by <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={form.paidById}
                                    onChange={(e) => {
                                        setForm((f) => ({ ...f, paidById: e.target.value }));
                                        if (fieldErrors.paidById) setFieldErrors((fe) => ({ ...fe, paidById: undefined }));
                                    }}
                                    disabled={submitting}
                                    className={`w-full rounded-lg border bg-gray-800 px-4 py-2.5 text-sm text-white focus:outline-none transition-colors disabled:opacity-50 ${fieldErrors.paidById ? "border-red-500 focus:border-red-400" : "border-gray-700 focus:border-indigo-500"
                                        }`}
                                >
                                    <option value="" disabled>Select member…</option>
                                    {balanceData?.balances.map((m) => (
                                        <option key={m.userId} value={m.userId}>{m.name}</option>
                                    ))}
                                </select>
                                {fieldErrors.paidById && <p className="mt-1 text-xs text-red-400">{fieldErrors.paidById}</p>}
                            </div>

                            {fieldErrors.server && <p className="text-red-400 text-xs">{fieldErrors.server}</p>}

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

            {/* Record Payment Modal */}
            {settlementModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
                    onClick={(e) => e.target === e.currentTarget && !settlementSubmitting && setSettlementModalOpen(false)}
                >
                    <div className="w-full max-w-sm rounded-2xl border border-gray-800 bg-gray-900 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold">Record a Payment</h2>
                            <button
                                onClick={() => !settlementSubmitting && setSettlementModalOpen(false)}
                                disabled={settlementSubmitting}
                                className="text-gray-500 hover:text-gray-300 transition-colors text-xl leading-none disabled:opacity-40"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSettlementSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">
                                    Who paid? <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={settlementForm.fromUserId}
                                    onChange={(e) => {
                                        setSettlementForm((f) => ({ ...f, fromUserId: e.target.value }));
                                        if (settlementFieldErrors.fromUserId) setSettlementFieldErrors((fe) => ({ ...fe, fromUserId: undefined }));
                                    }}
                                    disabled={settlementSubmitting}
                                    className={`w-full rounded-lg border bg-gray-800 px-4 py-2.5 text-sm text-white focus:outline-none transition-colors disabled:opacity-50 ${settlementFieldErrors.fromUserId ? "border-red-500 focus:border-red-400" : "border-gray-700 focus:border-indigo-500"
                                        }`}
                                >
                                    <option value="" disabled>Select payer…</option>
                                    {balanceData?.balances.map((m) => (
                                        <option key={m.userId} value={m.userId}>{m.name}</option>
                                    ))}
                                </select>
                                {settlementFieldErrors.fromUserId && <p className="mt-1 text-xs text-red-400">{settlementFieldErrors.fromUserId}</p>}
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">
                                    Who received it? <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={settlementForm.toUserId}
                                    onChange={(e) => {
                                        setSettlementForm((f) => ({ ...f, toUserId: e.target.value }));
                                        if (settlementFieldErrors.toUserId) setSettlementFieldErrors((fe) => ({ ...fe, toUserId: undefined }));
                                    }}
                                    disabled={settlementSubmitting}
                                    className={`w-full rounded-lg border bg-gray-800 px-4 py-2.5 text-sm text-white focus:outline-none transition-colors disabled:opacity-50 ${settlementFieldErrors.toUserId ? "border-red-500 focus:border-red-400" : "border-gray-700 focus:border-indigo-500"
                                        }`}
                                >
                                    <option value="" disabled>Select recipient…</option>
                                    {balanceData?.balances.map((m) => (
                                        <option key={m.userId} value={m.userId}>{m.name}</option>
                                    ))}
                                </select>
                                {settlementFieldErrors.toUserId && <p className="mt-1 text-xs text-red-400">{settlementFieldErrors.toUserId}</p>}
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">
                                    Amount (₹) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={settlementForm.amount}
                                    onChange={(e) => {
                                        setSettlementForm((f) => ({ ...f, amount: e.target.value }));
                                        if (settlementFieldErrors.amount) setSettlementFieldErrors((fe) => ({ ...fe, amount: undefined }));
                                    }}
                                    placeholder="0.00"
                                    disabled={settlementSubmitting}
                                    className={`w-full rounded-lg border bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors disabled:opacity-50 ${settlementFieldErrors.amount ? "border-red-500 focus:border-red-400" : "border-gray-700 focus:border-indigo-500"
                                        }`}
                                />
                                {settlementFieldErrors.amount && <p className="mt-1 text-xs text-red-400">{settlementFieldErrors.amount}</p>}
                            </div>

                            {settlementFieldErrors.server && <p className="text-red-400 text-xs">{settlementFieldErrors.server}</p>}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSettlementModalOpen(false)}
                                    disabled={settlementSubmitting}
                                    className="flex-1 rounded-lg border border-gray-700 py-2.5 text-sm text-gray-400 hover:border-gray-500 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={settlementSubmitting}
                                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors py-2.5 text-sm font-medium text-white"
                                >
                                    {settlementSubmitting && <Spinner className="w-4 h-4" />}
                                    {settlementSubmitting ? "Recording…" : "Record Payment"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
