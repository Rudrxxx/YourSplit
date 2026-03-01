"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";

// Dynamically import react-force-graph-2d to prevent SSR issues with canvas/window
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
    ssr: false,
    loading: () => (
        <div className="flex h-full w-full items-center justify-center text-gray-500 text-sm">
            <div className="h-6 w-6 rounded-full border-t-2 border-b-2 border-indigo-500 animate-spin mr-3"></div>
            Loading interactive visualization...
        </div>
    )
});

interface Node {
    id: string;
    name: string;
    balance: number;
    totalSpent: number;
}

interface Edge {
    from: string;
    to: string;
    amount: number;
}

export default function DebtGraph({ groupId }: { groupId: string }) {
    const [graphData, setGraphData] = useState<{ nodes: Record<string, unknown>[]; optimizedLinks: Record<string, unknown>[], rawLinks: Record<string, unknown>[] } | null>(null);
    const [viewMode, setViewMode] = useState<"optimized" | "raw">("optimized");
    const [loading, setLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 400 });

    useEffect(() => {
        const fetchGraph = async () => {
            try {
                const res = await fetch(`/api/groups/${groupId}/graph`);
                if (!res.ok) throw new Error("Failed to fetch graph data");
                const data = await res.json();

                // Format for react-force-graph
                const nodes = data.nodes.map((n: Node) => ({
                    id: n.id,
                    name: n.name,
                    balance: n.balance,
                    totalSpent: n.totalSpent,
                    // Val is node relative size based on total spent volume
                    val: Math.max(1.5, Math.pow(n.totalSpent, 0.45) / 2)
                }));

                const optimizedLinks = data.optimizedEdges.map((e: Edge) => ({
                    source: e.from,
                    target: e.to,
                    amount: e.amount,
                    name: `₹${e.amount.toFixed(2)}`
                }));

                const rawLinks = data.rawEdges.map((e: Edge) => ({
                    source: e.from,
                    target: e.to,
                    amount: e.amount,
                    name: `₹${e.amount.toFixed(2)}`
                }));

                setGraphData({ nodes, optimizedLinks, rawLinks });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchGraph();
    }, [groupId]);

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: 400
                });
            }
        };

        window.addEventListener("resize", updateDimensions);
        updateDimensions();

        // Slight delay to ensure layout is measured securely after mount
        const timeout = setTimeout(updateDimensions, 200);

        return () => {
            window.removeEventListener("resize", updateDimensions);
            clearTimeout(timeout);
        };
    }, []);

    // Color logic keeping consistent with dark theme
    const getNodeColor = (node: Record<string, unknown>) => {
        const balance = node.balance as number;
        if (balance > 0) return "#34d399"; // emerald-400 equivalent for positive
        if (balance < 0) return "#f87171"; // red-400 equivalent for negative
        return "#9ca3af"; // gray-400 for 0 balance
    };

    if (loading) {
        return (
            <div className="h-[400px] w-full rounded-2xl border border-gray-800 bg-gray-900/40 flex items-center justify-center animate-pulse shadow-inner">
                <div className="h-8 w-8 rounded-full border-t-2 border-b-2 border-indigo-500 animate-spin"></div>
            </div>
        );
    }

    if (!graphData || graphData.nodes.length === 0) {
        return (
            <div className="h-[400px] w-full rounded-2xl border border-gray-800 bg-gray-900/40 flex flex-col items-center justify-center shadow-inner text-gray-500 text-sm">
                <span className="text-3xl mb-3">🕸️</span>
                Not enough activity to visualize.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-end">
                <div className="flex items-center gap-1 bg-gray-900/60 p-1 rounded-lg border border-gray-800/80">
                    <button
                        onClick={() => setViewMode("raw")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${viewMode === "raw" ? "bg-gray-800 text-white shadow-sm ring-1 ring-gray-700/50" : "text-gray-500 hover:text-gray-300"}`}
                        title="Show all individual transaction routes"
                    >
                        Raw View
                    </button>
                    <button
                        onClick={() => setViewMode("optimized")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${viewMode === "optimized" ? "bg-indigo-900/60 text-indigo-100 shadow-sm ring-1 ring-indigo-700/50" : "text-gray-500 hover:text-indigo-300"}`}
                        title="Show minimum settlement transactions"
                    >
                        Optimized View
                    </button>
                </div>
            </div>

            <div ref={containerRef} className="h-[400px] w-full rounded-2xl border border-gray-800 bg-[#0a0a0e] overflow-hidden relative shadow-inner">
                <ForceGraph2D
                    width={dimensions.width}
                    height={dimensions.height}
                    graphData={{
                        nodes: graphData.nodes,
                        links: viewMode === "optimized" ? graphData.optimizedLinks : graphData.rawLinks
                    }}
                    nodeLabel={(node: Record<string, unknown>) => {
                        const balance = node.balance as number;
                        const spent = node.totalSpent as number;
                        const statusClass = balance > 0 ? "text-emerald-400" : balance < 0 ? "text-red-400" : "text-gray-400";
                        const statusText = balance > 0 ? "Gets back" : balance < 0 ? "Owes" : "Settled up";
                        const formattedBalance = balance === 0 ? "" : `₹${Math.abs(balance).toFixed(2)}`;

                        return `
                        <div class="bg-gray-900 border border-gray-800 rounded-lg p-3 shadow-xl backdrop-blur-sm shadow-black/50 text-xs min-w-[140px]">
                            <p class="font-bold text-white text-base mb-1.5">${node.name as string}</p>
                            <div class="flex items-center justify-between mb-1">
                                <span class="text-gray-500 font-medium">Spent</span>
                                <span class="font-semibold text-gray-200">₹${spent.toFixed(2)}</span>
                            </div>
                            <div class="flex items-center justify-between pt-1 border-t border-gray-800/80">
                                <span class="text-gray-500 font-medium">${statusText}</span>
                                <span class="font-bold ${statusClass}">${balance > 0 ? '+' : balance < 0 ? '-' : ''}${formattedBalance}</span>
                            </div>
                        </div>
                    `;
                    }}
                    nodeColor={getNodeColor}
                    nodeRelSize={5}
                    linkColor={() => "rgba(75, 85, 99, 0.4)"}
                    linkWidth={(link: Record<string, unknown>) => Math.max(1, Math.pow(link.amount as number, 0.25))}
                    linkDirectionalArrowLength={(link: Record<string, unknown>) => Math.max(4, Math.pow(link.amount as number, 0.25) * 1.5)}
                    linkDirectionalArrowRelPos={1}
                    d3VelocityDecay={0.2}
                    d3AlphaDecay={0.02}
                    backgroundColor="transparent"
                    linkCanvasObjectMode={() => "after"}
                    linkCanvasObject={(link: Record<string, unknown>, ctx: CanvasRenderingContext2D, globalScale: number) => {
                        const start = link.source as Record<string, number>;
                        const end = link.target as Record<string, number>;

                        // ignore unbound links
                        if (typeof start !== "object" || typeof end !== "object") return;

                        // calculate label positioning
                        const textPos = {
                            x: start.x + (end.x - start.x) / 2,
                            y: start.y + (end.y - start.y) / 2,
                        };

                        const relLink = { x: end.x - start.x, y: end.y - start.y };
                        let textAngle = Math.atan2(relLink.y, relLink.x);
                        // maintain label vertical orientation for legibility
                        if (textAngle > Math.PI / 2) textAngle = -(Math.PI - textAngle);
                        if (textAngle < -Math.PI / 2) textAngle = -(-Math.PI - textAngle);

                        const fontSize = 12 / globalScale;
                        ctx.font = `600 ${fontSize}px Inter, sans-serif`;
                        const label = link.name as string;

                        ctx.save();
                        ctx.translate(textPos.x, textPos.y);
                        ctx.rotate(textAngle);

                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";

                        // Text background for readability
                        const textWidth = ctx.measureText(label).width;
                        const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4);

                        ctx.fillStyle = "rgba(10, 10, 14, 0.9)";
                        ctx.fillRect(
                            -bckgDimensions[0] / 2,
                            -bckgDimensions[1] / 2 - 2,
                            bckgDimensions[0],
                            bckgDimensions[1]
                        );

                        ctx.fillStyle = "rgba(156, 163, 175, 1)";
                        ctx.fillText(label, 0, -2);
                        ctx.restore();
                    }}
                />
            </div>
        </div>
    );
}
