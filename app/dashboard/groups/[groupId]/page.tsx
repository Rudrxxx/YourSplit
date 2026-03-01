"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useMemo } from "react";
import DebtGraph from "@/components/DebtGraph";

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
    const [viewMode, setViewMode] = useState<"list" | "graph">("list");

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
            totals[exp.paidById].amount += Number(exp.amount);
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
        b > 0 ? "text-emerald-600" : b < 0 ? "text-red-600" : "text-slate-500";
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

            <div className="max-w-2xl mx-auto py-10 px-6 min-h-[calc(100vh-8rem)] bg-transparent text-slate-900 w-full">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 font-semibold transition-colors mb-8"
                >
                    ← Back to groups
                </Link>

                {/* Initial loading skeleton */}
                {loading && (
                    <div className="space-y-4">
                        <div className="h-8 w-48 rounded-lg bg-slate-200 animate-pulse" />
                        <div className="h-28 rounded-xl bg-slate-200 animate-pulse" />
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 rounded-xl bg-slate-200 animate-pulse" />
                        ))}
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-600 shadow-sm text-sm font-semibold">
                        Failed to load group: {error}
                    </div>
                )}

                {/* Content — shown immediately, dims while refreshing */}
                {!loading && !error && balanceData && settlementData && (
                    <div className={`transition-opacity duration-200 ${refreshing ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
                            <div>
                                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
                                    <span className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </span>
                                    Group Balances
                                </h1>
                                <p className="text-xs text-slate-500 mt-2 font-mono bg-slate-100 px-2.5 py-1 rounded inline-block border border-slate-200 uppercase tracking-widest font-semibold">
                                    ID: {balanceData.groupId}
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                                <a
                                    href={`/api/groups/${groupId}/export`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 py-2 px-4 shadow-sm text-sm font-bold text-slate-700 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Export
                                </a>
                                <button
                                    onClick={openMemberModal}
                                    disabled={refreshing}
                                    className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 py-2 px-4 shadow-sm text-sm font-bold text-slate-700 transition-colors disabled:opacity-50"
                                >
                                    + Add Member
                                </button>
                                <button
                                    onClick={openSettlementModal}
                                    disabled={refreshing}
                                    className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 py-2 px-4 shadow-sm text-sm font-bold text-slate-700 transition-colors disabled:opacity-50"
                                >
                                    Record Payment
                                </button>
                                <button
                                    onClick={openModal}
                                    disabled={refreshing}
                                    className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-sm hover:shadow-md disabled:opacity-50 transition-colors px-4 py-2 text-sm font-bold text-white"
                                >
                                    {refreshing ? <Spinner className="w-4 h-4" /> : null}
                                    + Add Expense
                                </button>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-8 mb-8 grid grid-cols-2 gap-6 shadow-sm shadow-slate-200 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl pointer-events-none"></div>

                            <div className="relative z-10">
                                <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Total Expenses
                                </p>
                                <p className="text-4xl font-extrabold tracking-tight text-slate-900 drop-shadow-sm">₹{Number(balanceData.totalExpenses).toFixed(2)}</p>
                            </div>
                            <div className="border-l border-slate-100 pl-8 relative z-10">
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    Per Person
                                </p>
                                <p className="text-4xl font-extrabold tracking-tight text-slate-700 drop-shadow-sm">₹{Number(balanceData.perPersonShare).toFixed(2)}</p>
                            </div>
                        </div>

                        {/* Insights strip */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-5 mb-10 grid grid-cols-3 divide-x divide-slate-200 shadow-sm">
                            <div className="pr-5 group cursor-pointer" onClick={openMemberModal}>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 shadow-sm group-hover:text-indigo-600 transition-colors">Members</p>
                                <p className="text-2xl font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{balanceData.balances.length}</p>
                            </div>
                            <div className="px-5 group cursor-pointer" onClick={() => document.getElementById('expense-history')?.scrollIntoView({ behavior: 'smooth' })}>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 shadow-sm group-hover:text-indigo-600 transition-colors">Expenses</p>
                                <p className="text-2xl font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{expenses.length}</p>
                            </div>
                            <div className="pl-5">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 shadow-sm">Last Expense</p>
                                <p className="text-xl font-bold text-slate-600">
                                    {expenses.length > 0
                                        ? new Date(expenses[0].createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                                        : "—"}
                                </p>
                            </div>
                        </div>

                        {/* No expenses empty state OR member/settlement sections */}
                        {balanceData.totalExpenses === 0 ? (
                            <div className="rounded-3xl border border-indigo-100 bg-white px-8 py-20 text-center shadow-md shadow-indigo-500/5 relative overflow-hidden mt-8">
                                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent"></div>
                                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-indigo-100 bg-indigo-50 shadow-sm">
                                    <span className="text-4xl">💸</span>
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">No expenses yet</h2>
                                <p className="text-base text-slate-500 max-w-sm mx-auto leading-relaxed mb-8 font-medium">
                                    Add the first expense to start tracking who owes what across the group effortlessly.
                                </p>
                                <button
                                    onClick={openModal}
                                    className="rounded-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 shadow-sm hover:shadow-md transition-all duration-300 px-8 py-3.5 text-base font-bold text-white flex items-center gap-2 mx-auto"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add First Expense
                                </button>
                            </div>
                        ) : (
                            <>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">Contributor Analytics</p>
                                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden mb-8 shadow-sm">
                                    {analytics.topContributor && (
                                        <div className="bg-indigo-50 border-b border-indigo-100 px-5 py-4 flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-indigo-500 font-bold uppercase tracking-wider mb-0.5">Top Contributor 👑</p>
                                                <p className="text-slate-900 font-bold text-lg">{analytics.topContributor.name}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-semibold text-indigo-400 mb-0.5">Total Spent</p>
                                                <p className="text-indigo-600 font-extrabold text-xl">₹{Number(analytics.topContributor.amount).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    )}
                                    <ul className="divide-y divide-slate-100">
                                        {analytics.leaderboard.map((user, idx) => (
                                            <li key={idx} className="flex items-center justify-between px-5 py-3 bg-white hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm text-slate-400 font-bold w-4">{idx + 1}.</span>
                                                    <span className="text-slate-700 font-semibold">{user.name}</span>
                                                </div>
                                                <span className="text-slate-900 font-bold">₹{Number(user.amount).toFixed(2)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">Members</p>
                                <ul className="space-y-3 mb-8">
                                    {balanceData.balances.map((member) => (
                                        <li
                                            key={member.userId}
                                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white shadow-sm px-5 py-4 hover:bg-slate-50 hover:border-indigo-200 hover:-translate-y-0.5 transition-all duration-300"
                                        >
                                            <div>
                                                <p className="font-bold text-slate-900 text-base">{member.name}</p>
                                                <p className={`text-sm mt-0.5 font-semibold ${balanceColor(member.balance)}`}>
                                                    {balanceLabel(member.balance)}
                                                </p>
                                            </div>
                                            <span className={`text-lg font-bold tabular-nums tracking-tight ${balanceColor(member.balance)}`}>
                                                {Number(member.balance) > 0 ? "+" : ""}₹{Number(member.balance).toFixed(2)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Settlement Plan</p>
                                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                                        <button
                                            onClick={() => setViewMode("list")}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${viewMode === "list" ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700"}`}
                                        >
                                            List View
                                        </button>
                                        <button
                                            onClick={() => setViewMode("graph")}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${viewMode === "graph" ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200" : "text-slate-500 hover:text-indigo-600"}`}
                                        >
                                            Graph View
                                        </button>
                                    </div>
                                </div>
                                {viewMode === "graph" ? (
                                    <div className="mt-2 animate-in fade-in zoom-in-95 duration-300">
                                        <DebtGraph groupId={groupId as string} />
                                    </div>
                                ) : settlementData.settlements.length === 0 ? (
                                    <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-6 text-center text-emerald-600 shadow-sm text-sm font-bold animate-in fade-in zoom-in-95 duration-300">
                                        ✓ All settled up securely
                                    </div>
                                ) : (
                                    <ul className="space-y-3 mt-2 animate-in fade-in zoom-in-95 duration-300">
                                        {settlementData.settlements.map((s, i) => (
                                            <li
                                                key={i}
                                                className="flex items-center justify-between rounded-xl border border-indigo-100 bg-white px-5 py-4 shadow-sm hover:border-indigo-200 transition-colors"
                                            >
                                                <div className="flex items-center gap-3 text-sm">
                                                    <span className="font-bold text-red-600">{s.from}</span>
                                                    <span className="text-slate-400 font-bold hidden sm:inline">→</span>
                                                    <span className="font-bold text-emerald-600">{s.to}</span>
                                                </div>
                                                <span className="text-slate-900 font-bold tracking-tight tabular-nums">
                                                    ₹{Number(s.amount).toFixed(2)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </>
                        )}

                        {/* Expense History */}
                        <div id="expense-history" className="pt-8">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">Expense History</p>
                            {expenses.length === 0 ? (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-6 text-center text-slate-500 text-sm font-medium shadow-sm">
                                    No expenses recorded yet.
                                </div>
                            ) : (
                                <ul className="space-y-3">
                                    {expenses.map((exp) => (
                                        <li
                                            key={exp.id}
                                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white shadow-sm px-5 py-4 hover:border-indigo-200 hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 truncate text-base">{exp.description}</p>
                                                <p className="text-xs text-slate-500 mt-1 font-semibold tracking-wide">
                                                    PAID BY <span className="text-slate-700 font-bold">{exp.paidBy.name.toUpperCase()}</span>
                                                    {" · "}
                                                    {new Date(exp.createdAt).toLocaleDateString("en-IN", {
                                                        day: "2-digit", month: "short", year: "numeric",
                                                    }).toUpperCase()}
                                                </p>
                                            </div>
                                            <span className="ml-4 text-slate-900 font-extrabold tracking-tight text-lg tabular-nums shrink-0">
                                                ₹{Number(exp.amount).toFixed(2)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Activity Timeline */}
                        <div className="pt-10">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-4">Activity Timeline</p>
                            {activities.length === 0 ? (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-6 text-center text-slate-500 text-sm font-medium shadow-sm">
                                    No activity yet.
                                </div>
                            ) : (
                                <div className="relative border-l border-slate-200 ml-3 space-y-6 pb-4">
                                    {activities.map((act) => (
                                        <div key={act.id} className="relative pl-6 group">
                                            <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-indigo-500 ring-4 ring-white group-hover:bg-indigo-400 group-hover:ring-slate-50 transition-colors shadow-sm"></span>
                                            <p className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">{act.message}</p>
                                            <p className="text-[11px] font-bold tracking-wide text-slate-400 mt-1">
                                                {new Date(act.createdAt).toLocaleString("en-IN", {
                                                    day: "numeric", month: "short", hour: "numeric", minute: "2-digit"
                                                }).toUpperCase()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Expense Modal */}
            {modalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4"
                    onClick={(e) => e.target === e.currentTarget && !submitting && setModalOpen(false)}
                >
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Add Expense</h2>
                            <button
                                onClick={() => !submitting && setModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors text-2xl leading-none disabled:opacity-40"
                                disabled={submitting}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
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
                                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm placeholder-slate-400 focus:outline-none transition-all disabled:opacity-50 disabled:bg-slate-50 ${fieldErrors.description ? "border-red-500 focus:ring-1 focus:ring-red-500 focus:border-red-500" : "border-slate-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                        }`}
                                />
                                {fieldErrors.description && <p className="mt-1 text-xs font-semibold text-red-500">{fieldErrors.description}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
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
                                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm placeholder-slate-400 focus:outline-none transition-all disabled:opacity-50 disabled:bg-slate-50 ${fieldErrors.amount ? "border-red-500 focus:ring-1 focus:ring-red-500 focus:border-red-500" : "border-slate-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                        }`}
                                />
                                {fieldErrors.amount && <p className="mt-1 text-xs font-semibold text-red-500">{fieldErrors.amount}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                                    Paid by <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={form.paidById}
                                    onChange={(e) => {
                                        setForm((f) => ({ ...f, paidById: e.target.value }));
                                        if (fieldErrors.paidById) setFieldErrors((fe) => ({ ...fe, paidById: undefined }));
                                    }}
                                    disabled={submitting}
                                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm focus:outline-none transition-all disabled:opacity-50 disabled:bg-slate-50 ${fieldErrors.paidById ? "border-red-500 focus:ring-1 focus:ring-red-500 focus:border-red-500" : "border-slate-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                        }`}
                                >
                                    <option value="" disabled>Select member…</option>
                                    {balanceData?.balances.map((m) => (
                                        <option key={m.userId} value={m.userId}>{m.name}</option>
                                    ))}
                                </select>
                                {fieldErrors.paidById && <p className="mt-1 text-xs font-semibold text-red-500">{fieldErrors.paidById}</p>}
                            </div>

                            {fieldErrors.server && <p className="text-red-500 text-xs font-semibold">{fieldErrors.server}</p>}

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
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4"
                    onClick={(e) => e.target === e.currentTarget && !memberSubmitting && setMemberModalOpen(false)}
                >
                    <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Add Member</h2>
                            <button
                                onClick={() => !memberSubmitting && setMemberModalOpen(false)}
                                disabled={memberSubmitting}
                                className="text-slate-400 hover:text-slate-600 transition-colors text-2xl leading-none disabled:opacity-40"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleMemberSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Name</label>
                                <input
                                    type="text"
                                    value={memberForm.name}
                                    onChange={(e) => setMemberForm((f) => ({ ...f, name: e.target.value }))}
                                    placeholder="Jane Doe"
                                    disabled={memberSubmitting}
                                    autoFocus
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm placeholder-slate-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all disabled:opacity-50 disabled:bg-slate-50"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                                    Email <span className="normal-case text-slate-400">(optional)</span>
                                </label>
                                <input
                                    type="email"
                                    value={memberForm.email}
                                    onChange={(e) => setMemberForm((f) => ({ ...f, email: e.target.value }))}
                                    placeholder="jane@example.com"
                                    disabled={memberSubmitting}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm placeholder-slate-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all disabled:opacity-50 disabled:bg-slate-50"
                                />
                            </div>

                            {memberFormError && <p className="text-red-500 font-semibold text-xs">{memberFormError}</p>}

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
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4"
                    onClick={(e) => e.target === e.currentTarget && !settlementSubmitting && setSettlementModalOpen(false)}
                >
                    <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Record a Payment</h2>
                            <button
                                onClick={() => !settlementSubmitting && setSettlementModalOpen(false)}
                                disabled={settlementSubmitting}
                                className="text-slate-400 hover:text-slate-600 transition-colors text-2xl leading-none disabled:opacity-40"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSettlementSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                                    Who paid? <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={settlementForm.fromUserId}
                                    onChange={(e) => {
                                        setSettlementForm((f) => ({ ...f, fromUserId: e.target.value }));
                                        if (settlementFieldErrors.fromUserId) setSettlementFieldErrors((fe) => ({ ...fe, fromUserId: undefined }));
                                    }}
                                    disabled={settlementSubmitting}
                                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm focus:outline-none transition-all disabled:opacity-50 disabled:bg-slate-50 ${settlementFieldErrors.fromUserId ? "border-red-500 focus:ring-1 focus:ring-red-500 focus:border-red-500" : "border-slate-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                        }`}
                                >
                                    <option value="" disabled>Select payer…</option>
                                    {balanceData?.balances.map((m) => (
                                        <option key={m.userId} value={m.userId}>{m.name}</option>
                                    ))}
                                </select>
                                {settlementFieldErrors.fromUserId && <p className="mt-1 text-xs font-semibold text-red-500">{settlementFieldErrors.fromUserId}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                                    Who received it? <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={settlementForm.toUserId}
                                    onChange={(e) => {
                                        setSettlementForm((f) => ({ ...f, toUserId: e.target.value }));
                                        if (settlementFieldErrors.toUserId) setSettlementFieldErrors((fe) => ({ ...fe, toUserId: undefined }));
                                    }}
                                    disabled={settlementSubmitting}
                                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm focus:outline-none transition-all disabled:opacity-50 disabled:bg-slate-50 ${settlementFieldErrors.toUserId ? "border-red-500 focus:ring-1 focus:ring-red-500 focus:border-red-500" : "border-slate-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                        }`}
                                >
                                    <option value="" disabled>Select recipient…</option>
                                    {balanceData?.balances.map((m) => (
                                        <option key={m.userId} value={m.userId}>{m.name}</option>
                                    ))}
                                </select>
                                {settlementFieldErrors.toUserId && <p className="mt-1 text-xs font-semibold text-red-500">{settlementFieldErrors.toUserId}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
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
                                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm placeholder-slate-400 focus:outline-none transition-all disabled:opacity-50 disabled:bg-slate-50 ${settlementFieldErrors.amount ? "border-red-500 focus:ring-1 focus:ring-red-500 focus:border-red-500" : "border-slate-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                        }`}
                                />
                                {settlementFieldErrors.amount && <p className="mt-1 text-xs font-semibold text-red-500">{settlementFieldErrors.amount}</p>}
                            </div>

                            {settlementFieldErrors.server && <p className="text-red-500 text-xs font-semibold">{settlementFieldErrors.server}</p>}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setSettlementModalOpen(false)}
                                    disabled={settlementSubmitting}
                                    className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={settlementSubmitting}
                                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors py-3 text-sm font-bold text-white"
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
