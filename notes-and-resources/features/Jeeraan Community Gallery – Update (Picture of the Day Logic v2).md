That’s a very smart catch — without this rule, your system would quietly reward **inactivity**, which undermines the whole purpose of the Gallery.

Let’s formalize this properly so it’s **clear, enforceable, and scalable**.

---

# 🖼️ **Jeeraan Community Gallery – Update (Picture of the Day Logic v2)**

## 🎯 Objective

Ensure that **“Picture of the Day” rewards reflect *active engagement***, not just historical momentum.

---

## 🏆 Updated Rule (Clear Definition)

> A picture can only win “Picture of the Day” again if it has received **at least one new vote within the current day’s cycle**.

---

## ⏰ Daily Cycle Context

* Daily cutoff: **10:00 PM**
* Each day is treated as a **new scoring window**

---

## 🔄 Updated Workflow Logic

### **Step 1: Track Votes by Day**

Instead of just total votes, track **daily vote activity**:

```ts
Vote {
  userId
  postId
  createdAt
}
```

---

### **Step 2: Compute Daily Vote Count**

```ts
dailyVotes = countVotes(postId, today)
```

---

### **Step 3: Determine Eligibility**

```ts
if dailyVotes > 0:
    eligible = true
else:
    eligible = false
```

---

### **Step 4: Select Winner (10 PM)**

From all **eligible posts only**:

```ts
winner = postWithHighest(dailyVotes)
```

---

### **Step 5: Award Points**

```ts
if winner:
    awardPoints(winner.userId, +3)
```

---

## 🚫 Edge Case (Your Scenario)

> Yesterday: 7 votes
> Today: 0 votes

➡️ Result:

* ❌ Not eligible
* ❌ Cannot win again
* ✅ No additional points awarded

---

## ✅ Optional Enhancement (Recommended)

### **“Trending Boost” Rule**

To make things more dynamic:

> A post must have **at least X new votes (e.g., 2 votes)** to qualify

```ts
if dailyVotes >= 2:
    eligible = true
```

👉 This prevents:

* One accidental vote from triggering a win
* Low-effort manipulation

---

## 🧠 UX Considerations

### On Gallery Feed

Add subtle indicator:

* 🔥 “Trending Today” → if votes today > 0
* 🏆 “Yesterday’s Winner” badge

---

### On Detail Page

Show:

* Total votes
* **Votes today (new activity)**

---

## 💡 Strategic Insight

This rule does something important:

* Encourages **continuous engagement**
* Prevents “set it and forget it” wins
* Keeps the Gallery **fresh daily**

---

## 🚀 Final Recommendation

Use this combined rule:

```plaintext
A post is eligible for “Picture of the Day” only if:
1. It received at least 1 new vote today
2. It has the highest number of votes for the current day
```

👉 If you want tighter control:

* Raise minimum to 2–3 votes/day later (based on usage)

---

If you want next, I can:
👉 Add this into your **full Gallery PRD (clean version)**
👉 Or design the **ranking algorithm (including tie-breakers + fairness rules)**
