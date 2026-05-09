This is a strong expansion — you’re adding **daily habit loops (Whiteboard)** and **social/visual engagement (Gallery)**, which together can significantly increase retention.

I’ll structure both features into clean, **production-ready implementation plans**, similar to your Classified Ads.

---

# 🧠 **Jeeraan Whiteboard – Daily Question System (Implementation Plan)**

---

## 1. 🎯 Feature Overview

A **daily engagement feature** where:

* AI generates **5 questions daily**
* Members **vote to select 1 question**
* Members **submit 1 answer**
* Answers are **ephemeral (auto-deleted daily)**
* Points are awarded for:

  * Voting → +1 point
  * Answering → +2 points

---

## 2. 🔄 Daily Lifecycle (Core Logic)

### ⏰ Schedule (Central Time)

* **6:00 AM**

  * Generate 5 new questions
  * Delete previous answers
* **6:00 AM – 12:00 PM**

  * Voting window
* **12:00 PM**

  * Winning question selected
* **12:00 PM – Next Day 6:00 AM**

  * Answer submission window

---

## 3. 🔄 End-to-End Workflow

---

### **Step 1: AI Question Generation**

Use:

* **OpenAI**
* **Google Cloud**

#### Requirements:

* Generate 5 questions daily
* Ensure:

  * No duplication
  * Mixed categories
  * Age-inclusive

```ts
generateQuestions(previousQuestions[])
```

---

### **Step 2: Store Questions**

```ts
DailyQuestionBatch {
  id
  questions: [q1, q2, q3, q4, q5]
  date
  selectedQuestionId
}
```

---

### **Step 3: Voting Phase**

Rules:

* 1 vote per user
* Voting closes at 12 PM

```ts
Vote {
  userId
  questionId
}
```

➡️ Award +1 point after voting

---

### **Step 4: Question Selection**

```ts
selected = questionWithMostVotes()
```

---

### **Step 5: Answer Submission**

Rules:

* 1 answer per user
* Allowed until next day 6 AM

```ts
Answer {
  userId
  questionId
  content
}
```

➡️ Award +2 points after submission

---

### **Step 6: Data Cleanup (Critical)**

At next cycle:

* Delete all answers

```ts
delete(answers where date = yesterday)
```

---

## 4. 🎨 UX Layout

### Screen Sections

#### Top:

* “Today’s Question” (after 12 PM)
* OR “Vote for today’s question” (before 12 PM)

---

#### Voting UI:

* List of 5 cards
* Tap to vote

---

#### Answer UI:

* Textarea
* Submit button

---

#### Info Modal:

> “How it works”

---

## 5. ⚠️ Rules Enforcement

* Prevent duplicate answers
* Prevent multiple votes
* Filter inappropriate content

---

## 6. 🤖 AI Moderation (Optional Enhancement)

Use:

* **OpenAI moderation**
* Toxicity filtering

---

## 7. 💡 Key Design Insight

This feature:

* Creates **daily habit**
* Encourages **light participation**
* Builds **community voice**

---

# 🖼️ **Jeeraan Community Gallery – Implementation Plan**

---

## 1. 🎯 Feature Overview

A **curated, community-driven image gallery** where:

* Members post **1 image per day**
* Content is **non-personal (no faces/selfies)**
* Engagement via:

  * Votes
  * Comments
* Daily winner = **Picture of the Day**

---

## 2. 📸 Core Rules

* ❌ No images of people/faces
* ✅ Nature, objects, travel, etc.
* ✅ 1 upload per user per day
* ✅ Description required (≥10 chars)
* ✅ Size limit (recommended: 5MB max)

---

## 3. 🔄 End-to-End Workflow

---

### **Step 1: Upload Image**

Form includes:

* Image
* Description

Validation:

```ts
if description.length < 10:
    reject
```

---

### **Step 2: Moderation (Two Options)**

#### MVP (Manual Approval)

* Notify Moderators & Neighborhood Admins
* Status = `pending`

#### Future (AI Validation)

Use:

* **Google Cloud**
* Detect:

  * Faces
  * Unsafe content

---

### **Step 3: Approval Flow**

```ts
if approved:
    status = active
else:
    reject
```

---

### **Step 4: Display Feed**

Sorted by:

* Highest score (votes)

Card includes:

* Image thumbnail
* Member name
* Description preview
* Votes
* Comments

---

### **Step 5: Engagement Actions**

#### Comment

* 1 per user
* +1 point

#### Vote

* Upvote/downvote
* No points

---

### **Step 6: Picture of the Day**

* Cutoff: **10 PM**
* Highest score wins

➡️ Award +3 points

---

## 4. 📱 Detail View

Shows:

* Full image
* Description
* Comments list
* Comment box

---

## 5. 📦 Data Model

```ts
GalleryPost {
  id
  userId
  imageUrl
  description
  votes
  status
  createdAt
}

Comment {
  id
  userId
  postId
  content
}
```

---

## 6. 📜 Image Policy (Draft)

---

### **Community Gallery Policy**

By uploading an image, you agree:

* Images must not contain identifiable individuals or faces
* Content must be appropriate and respectful
* You own or have rights to the image
* Jeeraan reserves the right to remove any content

---

## 7. ⚠️ Risks & Mitigation

### 🚨 Face Detection Challenge

* Use AI or manual approval

---

### 🚨 Spam Uploads

* Limit: 1/day (you already did ✅)

---

### 🚨 Low-Quality Content

* Admin removal tools

---

## 8. 🧠 UX Enhancements

* “Today’s Top Photo” badge
* Highlight winner
* Lazy loading grid

---

## 9. 🚀 Optional Future Features

* Categories (Nature, Travel, etc.)
* Weekly winners
* Archive gallery

---

# 🔥 Final Strategic Insight

You’ve now added:

### Whiteboard

→ Daily habit + light engagement

### Gallery

→ Visual + emotional engagement

👉 Combined impact:

* More daily logins
* More interaction
* Stronger community identity

---

# 🧩 What You Might Still Be Missing

### 1. Notification System

* “New question available”
* “Your photo is trending”

---

### 2. Anti-Abuse System

* Rate limiting
* Reporting

---

### 3. Storage Optimization

* Image compression
* CDN delivery

---

If you want next, I can:
👉 Design the **UI screens (Whiteboard + Gallery)** based on your current app style
👉 Or create **Convex/InsForge backend schemas + scheduled jobs** for automation
