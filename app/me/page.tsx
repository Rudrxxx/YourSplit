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
            } catch (err: any) {
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
            <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
                <Spinner className="w-8 h-8 text-indigo-500" />
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen bg-gray-950 text-white p-10">
                <p className="text-red-400">Failed to load system data: {error}</p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-950 text-white px-6 py-10 relative">
            <div className="max-w-3xl mx-auto space-y-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-800">
                    <div>
                        <Link href="/dashboard" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium tracking-wide flex items-center gap-1.5 mb-3 transition-colors">
                            <span>←</span> Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Financial Overview</h1>
                        <p className="text-gray-400 text-sm">Review your cross-group standing across the platform.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-400 whitespace-nowrap">View as:</label>
                        <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            disabled={calculating}
                            className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 transition-colors"
                        >
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {calculating && (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500 space-y-4">
                        <Spinner className="w-8 h-8 text-indigo-500" />
                        <p className="text-sm animate-pulse">Aggregating balances across {groups.length} groups...</p>
                    </div>
                )}

                {/* Dashboard Metrics */}
                {!calculating && financials && (
                    <div className="space-y-12 animate-in fade-in duration-500 slide-in-from-bottom-4">

                        {/* Top Level Metric Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Owe Metric */}
                            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <svg className="w-16 h-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                    </svg>
                                </div>
                                <p className="text-sm text-gray-400 font-medium uppercase tracking-widest mb-2">Total You Owe</p>
                                <div className="flex items-baseline gap-2 text-red-400">
                                    <span className="text-4xl font-bold tracking-tight">₹{financials.totalIOwe.toFixed(2)}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-4 leading-snug">
                                    The sum of outstanding debts across all your active split groups.
                                </p>
                            </div>

                            {/* Owed To Metric */}
                            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <svg className="w-16 h-16 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                                <p className="text-sm text-gray-400 font-medium uppercase tracking-widest mb-2">Total Owed To You</p>
                                <div className="flex items-baseline gap-2 text-emerald-400">
                                    <span className="text-4xl font-bold tracking-tight">₹{financials.totalOwedToMe.toFixed(2)}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-4 leading-snug">
                                    The sum of amounts that other group members currently owe you.
                                </p>
                            </div>
                        </div>

                        {/* Net Position Banner */}
                        <div className={`rounded-xl px-6 py-5 flex items-center justify-between border ${financials.netBalance > 0
                                ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400'
                                : financials.netBalance < 0
                                    ? 'bg-red-950/20 border-red-900/50 text-red-400'
                                    : 'bg-gray-800 border-gray-700 text-gray-400'
                            }`}>
                            <div>
                                <h3 className="text-sm font-semibold uppercase tracking-wide">Net Position</h3>
                                <p className="text-xs opacity-70 mt-0.5">Your overall standing when factoring all debts and credits seamlessly.</p>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-bold tabular-nums">
                                    {financials.netBalance > 0 ? '+' : ''}₹{financials.netBalance.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Breakdown Lists */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                            {/* Creditor Section */}
                            <div className="space-y-4">
                                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    Groups where you are a creditor
                                </h2>

                                {financials.creditorGroups.length === 0 ? (
                                    <div className="px-5 py-8 border border-dashed border-gray-800 rounded-xl bg-gray-900/30 text-center">
                                        <p className="text-sm text-gray-500">You are not a creditor in any group.</p>
                                    </div>
                                ) : (
                                    <ul className="space-y-3">
                                        {financials.creditorGroups.map((cg) => (
                                            <li key={cg.group.id} className="flex items-center justify-between bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors rounded-xl px-5 py-4">
                                                <div className="truncate pr-4">
                                                    <Link href={`/dashboard/groups/${cg.group.id}`} className="font-medium text-white hover:text-indigo-400 transition-colors truncate block">
                                                        {cg.group.name}
                                                    </Link>
                                                    <p className="text-xs text-gray-500 mt-0.5">Gets back</p>
                                                </div>
                                                <span className="text-emerald-400 font-semibold tabular-nums shrink-0">
                                                    +₹{cg.balance.toFixed(2)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Debtor Section */}
                            <div className="space-y-4">
                                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                    Groups where you are a debtor
                                </h2>

                                {financials.debtorGroups.length === 0 ? (
                                    <div className="px-5 py-8 border border-dashed border-gray-800 rounded-xl bg-gray-900/30 text-center">
                                        <p className="text-sm text-gray-500">You do not owe anything in any group.</p>
                                    </div>
                                ) : (
                                    <ul className="space-y-3">
                                        {financials.debtorGroups.map((dg) => (
                                            <li key={dg.group.id} className="flex items-center justify-between bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors rounded-xl px-5 py-4">
                                                <div className="truncate pr-4">
                                                    <Link href={`/dashboard/groups/${dg.group.id}`} className="font-medium text-white hover:text-indigo-400 transition-colors truncate block">
                                                        {dg.group.name}
                                                    </Link>
                                                    <p className="text-xs text-gray-500 mt-0.5">Owes</p>
                                                </div>
                                                <span className="text-red-400 font-semibold tabular-nums shrink-0">
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
