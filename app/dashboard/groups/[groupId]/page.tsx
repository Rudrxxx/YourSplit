"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

export default function GroupBalancesPage({
    params,
}: {
    params: Promise<{ groupId: string }>;
}) {
    const [groupId, setGroupId] = useState<string | null>(null);
    const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
    const [settlementData, setSettlementData] = useState<SettlementData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Unwrap async params (Next.js 15+)
    useEffect(() => {
        params.then((p) => setGroupId(p.groupId));
    }, [params]);

    useEffect(() => {
        if (!groupId) return;

        Promise.all([
            fetch(`/api/groups/${groupId}/balances`).then((r) => {
                if (!r.ok) throw new Error(`Balances: HTTP ${r.status}`);
                return r.json() as Promise<BalanceData>;
            }),
            fetch(`/api/groups/${groupId}/settlements`).then((r) => {
                if (!r.ok) throw new Error(`Settlements: HTTP ${r.status}`);
                return r.json() as Promise<SettlementData>;
            }),
        ])
            .then(([bal, set]) => {
                setBalanceData(bal);
                setSettlementData(set);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [groupId]);

    const balanceColor = (balance: number) => {
        if (balance > 0) return "text-emerald-400";
        if (balance < 0) return "text-red-400";
        return "text-gray-500";
    };

    const balanceLabel = (balance: number) => {
        if (balance > 0) return `gets back ₹${balance.toFixed(2)}`;
        if (balance < 0) return `owes ₹${Math.abs(balance).toFixed(2)}`;
        return "settled up";
    };

    return (
        <main className="min-h-screen bg-gray-950 text-white px-6 py-10">
            <div className="max-w-2xl mx-auto">

                {/* Back link */}
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-8"
                >
                    ← Back to groups
                </Link>

                {/* Loading skeleton */}
                {loading && (
                    <div className="space-y-4">
                        <div className="h-8 w-48 rounded-lg bg-gray-800 animate-pulse" />
                        <div className="h-28 rounded-xl bg-gray-800 animate-pulse" />
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-16 rounded-xl bg-gray-800 animate-pulse" />
                            ))}
                        </div>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="rounded-xl border border-red-800 bg-red-950/40 px-5 py-4 text-red-300 text-sm">
                        Failed to load group: {error}
                    </div>
                )}

                {/* Content */}
                {!loading && !error && balanceData && settlementData && (
                    <>
                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold tracking-tight">Group Balances</h1>
                            <p className="text-xs text-gray-600 mt-1 font-mono">{balanceData.groupId}</p>
                        </div>

                        {/* Summary card */}
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

                        {/* Member balances */}
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
                                        {member.balance > 0 ? "+" : ""}
                                        ₹{member.balance.toFixed(2)}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        {/* Settlement plan */}
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
        </main>
    );
}
