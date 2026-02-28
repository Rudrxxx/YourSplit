# YourSplit

An optimized peer-to-peer expense splitting platform that minimizes the number of settlement transactions using graph-based algorithms.

---

## 1. Problem Statement

### Problem Title
Peer-to-Peer Expense Splitter with Debt Simplification

### Problem Description
Managing shared expenses in groups often results in complex debt chains and unnecessary transactions. Existing tools calculate balances but do not optimize settlements.

### Target Users
- Flatmates
- Travel groups
- Friends
- Small teams
- Families

### Existing Gaps
- No transaction minimization
- Redundant payment chains
- Poor visualization of debt graph
- Lack of optimization layer

---

## 2. Problem Understanding & Approach

### Root Cause Analysis
Most expense splitters calculate balances but do not apply graph optimization techniques to reduce total settlement transactions.

### Solution Strategy
Model users as nodes in a graph and debts as directed weighted edges.
Apply a Minimum Cash Flow algorithm to reduce the number of transactions while preserving net balances.

---

## 3. Proposed Solution

### Solution Overview
YourSplit calculates group expenses, determines net balances, and applies a graph-based optimization algorithm to minimize required settlements.

### Core Idea
Use a greedy minimum cash flow algorithm to match largest debtor with largest creditor until all balances settle.

### Key Features
- Group expense tracking
- Net balance calculation
- Debt simplification engine
- Before vs After settlement comparison