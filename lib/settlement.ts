export interface BalanceEntity {
    userId: string;
    name: string;
    balance: number;
}

export interface SettlementTransaction {
    from: string;
    to: string;
    fromId: string;
    toId: string;
    amount: number;
}

/**
 * Calculates the minimum number of transactions required to settle debts.
 * Employs a greedy algorithm: sorts creditors and debtors by magnitude,
 * and repeatedly settles the largest possible amount between them.
 * Converts to integers internally to avoid floating-point precision errors.
 */
export function calculateSettlements(balances: BalanceEntity[]): SettlementTransaction[] {
    // Convert to integers (cents) to avoid precision errors
    const intBalances = balances.map((b) => ({
        ...b,
        balance: Math.round(b.balance * 100),
    }));

    const creditors = intBalances
        .filter((b) => b.balance > 0)
        .sort((a, b) => b.balance - a.balance); // Descending (largest credit first)

    const debtors = intBalances
        .filter((b) => b.balance < 0)
        .sort((a, b) => a.balance - b.balance); // Ascending (most negative first)

    const settlements: SettlementTransaction[] = [];
    let i = 0;
    let j = 0;

    while (i < creditors.length && j < debtors.length) {
        const creditor = creditors[i];
        const debtor = debtors[j];

        const amount = Math.min(creditor.balance, Math.abs(debtor.balance));

        if (amount > 0) {
            settlements.push({
                from: debtor.name,
                to: creditor.name,
                fromId: debtor.userId,
                toId: creditor.userId,
                amount: amount / 100, // Revert to standard currency decimal
            });
        }

        creditor.balance -= amount;
        debtor.balance += amount;

        if (creditor.balance === 0) i++;
        if (debtor.balance === 0) j++;
    }

    return settlements;
}
