"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";

interface User {
    id: string;
    name: string;
    email: string;
}

interface Group {
    id: string;
    name: string;
}

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

interface GroupFinancials {
    group: Group;
    balance: number;
}

function Spinner({ className = "" }: { className?: string }) {
    return (
        <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
        </svg>
    );
}

export default function MePage() {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>("");

    // Data state
    const [groups, setGroups] = useState<Group[]>([]);
    const [balancesData, setBalancesData] = useState<Record<string, BalanceData>>({});
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial load: fetch users and general groups (to know which ones to fetch balances for)
    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetch("/api/users").then(r => r.json() as Promise<User[]>),
            fetch("/api/groups").then(r => r.json() as Promise<Group[]>)
        ])
            .then(([fetchedUsers, fetchedGroups]) => {
                setUsers(fetchedUsers);
                setGroups(fetchedGroups);
                if (fetchedUsers.length > 0) {
                    setSelectedUserId(fetchedUsers[0].id);
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    // When a user is selected (or groups naturally load), fetch all balances to compute totals.
    // In a real app we'd fetch only groups the user belongs to via a backend query.
    useEffect(() => {
        if (!selectedUserId || groups.length === 0) return;

        setCalculating(true);
        const fetchAllBalances = async () => {
            try {
                const results: Record<string, BalanceData> = {};
                await Promise.all(
                    groups.map(async (group) => {
                        const res = await fetch(`/api/groups/${group.id}/balances`);
                        if (res.ok) {
                            const data = await res.json() as BalanceData;
                            results[group.id] = data;
                        }
                    })
                );
                setBalancesData(results);
            } catch (err: unknown) {
                console.error("Failed to fetch some balances", err);
            } finally {
                setCalculating(false);
            }
        };

        fetchAllBalances();
    }, [selectedUserId, groups]);

    // Compute the derived statistics based on balancesData map
    const financials = useMemo(() => {
        if (!selectedUserId || calculating) return null;

        let totalOwedToMe = 0; // creditor
        let totalIOwe = 0;     // debtor
        const creditorGroups: GroupFinancials[] = [];
        const debtorGroups: GroupFinancials[] = [];

        Object.entries(balancesData).forEach(([groupId, data]) => {
            const myBalance = data.balances.find(b => b.userId === selectedUserId)?.balance || 0;
            if (myBalance === 0) return; // Ignore if balanced or not in group

            const groupInfo = groups.find(g => g.id === groupId);
            if (!groupInfo) return;

            if (myBalance > 0) {
                totalOwedToMe += myBalance;
                creditorGroups.push({ group: groupInfo, balance: myBalance });
            } else if (myBalance < 0) {
                totalIOwe += Math.abs(myBalance);
                debtorGroups.push({ group: groupInfo, balance: myBalance });
            }
        });

        // Sort descending by amount magnitude
        creditorGroups.sort((a, b) => b.balance - a.balance);
        debtorGroups.sort((a, b) => a.balance - b.balance); // more negative to less negative -> magnitude desc

        return {
            totalOwedToMe,
            totalIOwe,
            netBalance: totalOwedToMe - totalIOwe,
            creditorGroups,
            debtorGroups
        };
    }, [selectedUserId, balancesData, groups, calculating]);

    if (loading) {
        return (
            <main className="min-h-screen bg-white text-slate-900 flex items-center justify-center">
                <Spinner className="w-8 h-8 text-indigo-500" />
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen bg-white text-slate-900 p-10">
                <p className="text-red-500 font-bold">Failed to load system data: {error}</p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-transparent text-slate-900 px-6 py-10 relative">
            <div className="max-w-3xl mx-auto space-y-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
                    <div>
                        <Link href="/dashboard" className="text-sm text-indigo-600 hover:text-indigo-500 font-bold tracking-wide flex items-center gap-1.5 mb-3 transition-colors">
                            <span>←</span> Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1">Financial Overview</h1>
                        <p className="text-slate-500 text-sm font-semibold">Review your cross-group standing across the platform.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="text-sm font-bold text-slate-500 whitespace-nowrap uppercase tracking-widest">View as:</label>
                        <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            disabled={calculating}
                            className="bg-white border border-slate-300 shadow-sm text-slate-900 font-semibold text-sm rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 transition-colors"
                        >
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {calculating && (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-4">
                        <Spinner className="w-8 h-8 text-indigo-500" />
                        <p className="text-sm font-bold animate-pulse">Aggregating balances across {groups.length} groups...</p>
                    </div>
                )}

                {/* Dashboard Metrics */}
                {!calculating && financials && (
                    <div className="space-y-12 animate-in fade-in duration-500 slide-in-from-bottom-4">

                        {/* Top Level Metric Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Owe Metric */}
                            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 relative overflow-hidden group hover:border-red-200 hover:shadow-md transition-all duration-300">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
                                    <svg className="w-20 h-20 text-red-500 transform translate-x-4 -translate-y-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                    </svg>
                                </div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                    Total You Owe
                                </p>
                                <div className="flex items-baseline gap-2 text-slate-900 mt-1">
                                    <span className="text-4xl font-extrabold tracking-tight tabular-nums">₹{financials.totalIOwe.toFixed(2)}</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-4 leading-snug font-semibold">
                                    The sum of outstanding debts across all your active split groups.
                                </p>
                            </div>

                            {/* Owed To Metric */}
                            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-200 hover:shadow-md transition-all duration-300">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
                                    <svg className="w-20 h-20 text-emerald-500 transform translate-x-4 -translate-y-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    Total Owed To You
                                </p>
                                <div className="flex items-baseline gap-2 text-slate-900 mt-1">
                                    <span className="text-4xl font-extrabold tracking-tight tabular-nums">₹{financials.totalOwedToMe.toFixed(2)}</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-4 leading-snug font-semibold">
                                    The sum of amounts that other group members currently owe you.
                                </p>
                            </div>
                        </div>

                        {/* Net Position Banner */}
                        <div className={`rounded-2xl px-6 py-5 flex items-center justify-between border shadow-sm ${financials.netBalance > 0
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : financials.netBalance < 0
                                ? 'bg-red-50 border-red-200 text-red-700'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}>
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest">Net Position</h3>
                                <p className={`text-xs mt-1 font-semibold ${financials.netBalance > 0 ? "text-emerald-600" : financials.netBalance < 0 ? "text-red-600" : "text-slate-500"}`}>Your overall standing when factoring all debts and credits seamlessly.</p>
                            </div>
                            <div className="text-right">
                                <span className={`text-3xl font-extrabold tabular-nums tracking-tight ${financials.netBalance > 0 ? "text-emerald-600" : financials.netBalance < 0 ? "text-red-600" : "text-slate-500"}`}>
                                    {financials.netBalance > 0 ? '+' : ''}₹{financials.netBalance.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Breakdown Lists */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                            {/* Creditor Section */}
                            <div className="space-y-4">
                                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    Groups where you are a creditor
                                </h2>

                                {financials.creditorGroups.length === 0 ? (
                                    <div className="px-5 py-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-center shadow-sm">
                                        <p className="text-sm font-semibold text-slate-500">You are not a creditor in any group.</p>
                                    </div>
                                ) : (
                                    <ul className="space-y-3">
                                        {financials.creditorGroups.map((cg) => (
                                            <li key={cg.group.id} className="group flex items-center justify-between bg-white border border-slate-200 hover:border-indigo-200 hover:bg-slate-50 hover:-translate-y-0.5 shadow-sm transition-all duration-300 rounded-xl px-5 py-4">
                                                <div className="truncate pr-4">
                                                    <Link href={`/dashboard/groups/${cg.group.id}`} className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate block text-base">
                                                        {cg.group.name}
                                                    </Link>
                                                    <p className="text-[11px] font-bold tracking-widest text-slate-500 mt-1 uppercase">Gets back</p>
                                                </div>
                                                <span className="text-emerald-600 text-lg font-bold tabular-nums shrink-0">
                                                    +₹{cg.balance.toFixed(2)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Debtor Section */}
                            <div className="space-y-4">
                                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                    Groups where you are a debtor
                                </h2>

                                {financials.debtorGroups.length === 0 ? (
                                    <div className="px-5 py-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-center shadow-sm">
                                        <p className="text-sm font-semibold text-slate-500">You do not owe anything in any group.</p>
                                    </div>
                                ) : (
                                    <ul className="space-y-3">
                                        {financials.debtorGroups.map((dg) => (
                                            <li key={dg.group.id} className="group flex items-center justify-between bg-white border border-slate-200 hover:border-indigo-200 hover:bg-slate-50 hover:-translate-y-0.5 shadow-sm transition-all duration-300 rounded-xl px-5 py-4">
                                                <div className="truncate pr-4">
                                                    <Link href={`/dashboard/groups/${dg.group.id}`} className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate block text-base">
                                                        {dg.group.name}
                                                    </Link>
                                                    <p className="text-[11px] font-bold tracking-widest text-slate-500 mt-1 uppercase">Owes</p>
                                                </div>
                                                <span className="text-red-600 text-lg font-bold tabular-nums shrink-0">
                                                    -₹{Math.abs(dg.balance).toFixed(2)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
