"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Group {
    id: string;
    name: string;
    createdAt: string;
}

export default function DashboardPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/groups")
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((data) => setGroups(data))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    return (
        <main className="min-h-screen bg-gray-950 text-white px-6 py-10">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-3xl font-bold tracking-tight">YourSplit</h1>
                    <p className="text-gray-400 mt-1 text-sm">Your groups</p>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-16 rounded-xl bg-gray-800 animate-pulse"
                            />
                        ))}
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="rounded-xl border border-red-800 bg-red-950/40 px-5 py-4 text-red-300 text-sm">
                        Failed to load groups: {error}
                    </div>
                )}

                {/* Empty — CTA */}
                {!loading && !error && groups.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-900/50 px-8 py-14 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-gray-700 bg-gray-800 text-2xl">
                            🧾
                        </div>
                        <h2 className="text-base font-semibold text-white mb-1">No groups yet</h2>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto">
                            Create a group to start splitting expenses with friends.
                        </p>
                        <p className="mt-5 inline-block rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-xs text-gray-400 font-mono">
                            POST /api/groups {"{ name }"}
                        </p>
                    </div>
                )}

                {/* Group list */}
                {!loading && !error && groups.length > 0 && (
                    <ul className="space-y-3">
                        {groups.map((group) => (
                            <li key={group.id}>
                                <Link
                                    href={`/dashboard/groups/${group.id}`}
                                    className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 px-5 py-4 hover:border-indigo-600 hover:bg-gray-800 transition-colors group"
                                >
                                    <div>
                                        <p className="font-medium text-white group-hover:text-indigo-400 transition-colors">
                                            {group.name}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {new Date(group.createdAt).toLocaleDateString("en-IN", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </p>
                                    </div>
                                    <span className="text-gray-600 group-hover:text-indigo-500 transition-colors text-lg">
                                        →
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </main>
    );
}
