<h1 align="center">✨ Shelfie ✨</h1>

<p align="center">
  <strong>Your library, your people, and recommendations that actually know you.</strong>
</p>

<p align="center">
  Track what you read, remember what you loved, share books with friends,<br />
  and let an AI reading companion help you find what comes next. 🩷
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-DB66A3?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React_19-DB66A3?style=for-the-badge&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-DB66A3?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-DB66A3?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-DB66A3?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Gemini-DB66A3?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Gemini" />
  <img src="https://img.shields.io/badge/Vercel-DB66A3?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

<p align="center">
  <img src="docs/screenshots/landing.png" alt="Shelfie landing page: the Shelfie title over a starry pink and purple sky above a bookshelf" width="100%" />
</p>

<p align="center"><img src="docs/assets/divider.svg" alt="" width="60%" /></p>

<p align="center">
  <a href="#-about">About</a> ✦
  <a href="#-features">Features</a> ✦
  <a href="#-how-recommendations-work">Recommendations</a> ✦
  <a href="#-privacy--safety">Privacy</a> ✦
  <a href="#-accessibility">Accessibility</a> ✦
  <a href="#-development-process">Development</a> ✦
  <a href="#-running-locally">Run it</a>
</p>

## 🌙 About

Most reading trackers feel like spreadsheets. **Shelfie** is meant to feel like a small corner of the night sky made for readers. It has literary typography, book covers front and center, soft sparkles and animations, and light and dark themes that both feel warm.

Underneath that atmosphere is a complete social reading app. You can:

- build a library and review what you read;
- follow other readers and send books to friends;
- see your reading life in charts;
- get personalized recommendations from an AI that reads your **whole shelf**, including your ratings, favorites and the words you wrote in your reviews.

<p align="center"><img src="docs/assets/divider.svg" alt="" width="60%" /></p>

## ✨ Features

### 📚 Search & book pages

<img src="https://img.shields.io/badge/Google%20Books%20search-DB66A3?style=flat-square" alt="" /> <img src="https://img.shields.io/badge/Paginated%20results-FFB7EE?style=flat-square" alt="" /> <img src="https://img.shields.io/badge/Rich%20book%20details-DB66A3?style=flat-square" alt="" />

Search millions of titles through the **Google Books API** right from the home page. Results are paginated, and covers load through a dedicated proxy so they stay fast and reliable. Each book has its own page with:

- cover, author, publisher, publication date and full description;
- your actions in one place: add to your library, save to your wishlist, mark as a favorite, review, or share;
- reviews from other readers, with **the people you follow shown first**.

<p align="center">
  <img src="docs/screenshots/search.gif" alt="Searching for a book and adding it to the library" width="80%" />
</p>

### 📖 Your library

<img src="https://img.shields.io/badge/Read%20%C2%B7%20Reading%20%C2%B7%20Abandoned-DB66A3?style=flat-square" alt="" /> <img src="https://img.shields.io/badge/Public%20or%20private-FFB7EE?style=flat-square" alt="" /> <img src="https://img.shields.io/badge/Favorites-DB66A3?style=flat-square" alt="" />

Your library is your personal shelf:

- Shelve books as **Read**, **Reading** or **Abandoned**. Abandoning a book is allowed here, and it also helps your recommendations.
- Make each book **public or private**, so your profile shows only what you choose.
- Mark the books that changed you as **favorites**.
- **Filter** by reading status, favorites or visibility, with a live "showing X of Y" count.

### ⭐ Ratings & reviews

<img src="https://img.shields.io/badge/1%20to%205%20stars-DB66A3?style=flat-square" alt="" /> <img src="https://img.shields.io/badge/Written%20reviews-FFB7EE?style=flat-square" alt="" /> <img src="https://img.shields.io/badge/Visibility%20control-DB66A3?style=flat-square" alt="" />

The review form asks three things:

1. **Where are you in this story?** Your reading status.
2. **How did it feel?** A 1–5 star rating, which you can also pick with the arrow keys.
3. **Leave a few words.** An optional written review.

You decide whether the review is shared with the reading circle, and you can edit it later.

### 🌙 Private wishlist

<img src="https://img.shields.io/badge/Only%20visible%20to%20you-DB66A3?style=flat-square" alt="" /> <img src="https://img.shields.io/badge/Separate%20from%20your%20library-FFB7EE?style=flat-square" alt="" />

Save the books you're curious about in a wishlist that **only you can see**, kept separate from your library. The AI also checks it: when something on your wishlist matches what you're asking for in the chat, it brings it up.

### 💫 For you: personalized recommendations

<img src="https://img.shields.io/badge/6%20picks%20per%20round-DB66A3?style=flat-square" alt="" /> <img src="https://img.shields.io/badge/Known%20%2B%20lesser--known%20finds-FFB7EE?style=flat-square" alt="" /> <img src="https://img.shields.io/badge/Verified%20on%20Google%20Books-DB66A3?style=flat-square" alt="" />

Each round gives you **six picks** made from your real reading:

- **Half are books you may have heard of**, and half are **lesser-known finds**, like small-press, translated, backlist and cult books that aren't the usual bestsellers.
- Every book comes with **a short reason** explaining why it fits you.
- Every book is **verified on Google Books** before it shows up, so you never get a title that doesn't exist.
- Picks **stream in one by one** as they're verified, so you don't wait for the whole list.
- **Not interested** removes a book for good. Books from your last five refreshes are skipped, so every refresh brings something new.
- The current set is saved, so coming back to the page is instant.

<p align="center">
  <img src="docs/screenshots/recs.gif" alt="Personalized recommendations streaming in on the For you page" width="80%" />
</p>

### 🤖 AI reading chat

<img src="https://img.shields.io/badge/Natural%20language-DB66A3?style=flat-square" alt="" /> <img src="https://img.shields.io/badge/Verified%20book%20cards-FFB7EE?style=flat-square" alt="" /> <img src="https://img.shields.io/badge/Saved%20conversations-DB66A3?style=flat-square" alt="" />

Start with a feeling, a genre, or a book you want to move away from:

> *"I want something similar to The Secret History, but lighter and with more mystery."*

If you're not sure what to ask, there are starter prompts like *"A fantasy book that makes me cry"* or *"A short, strange mystery"*.

- Answers use the **same reading context** as your recommendations.
- Suggestions appear as **book cards** with cover, author, the reason it was picked, a link to the book page and a *Not interested* action.
- Wishlist matches are marked **"From your wishlist"**.
- If a book can't be verified on Google Books, the assistant still names its title and author in plain text.
- Conversations are **saved in a sidebar**, so you can return to them or delete them.

<p align="center">
  <img src="docs/screenshots/chat.gif" alt="Asking the AI reading chat for a recommendation and getting verified book cards" width="80%" />
</p>

### 🧑‍🤝‍🧑 Readers, together

<img src="https://img.shields.io/badge/Profiles-DB66A3?style=flat-square" alt="" /> <img src="https://img.shields.io/badge/Follow%20readers-FFB7EE?style=flat-square" alt="" /> <img src="https://img.shields.io/badge/Share%20books-DB66A3?style=flat-square" alt="" /> <img src="https://img.shields.io/badge/Notifications-FFB7EE?style=flat-square" alt="" />

- **Profiles** have a photo, a bio and your public library. Search for readers by username.
- **Follow** other readers and look through their shelves. Follower counts are public, but only you can see your full lists.
- **Share a book** with anyone you follow, with an optional note. You can share any book, even one that isn't on your shelf yet:
  > *"Please read this, I need someone to talk about it with."*
- **Shared books** collects everything your friends have sent you.
- **Notifications** let you know about new followers and shared books. They have an unread badge, "mark as read" and delete.

<p align="center">
  <img src="docs/screenshots/share.gif" alt="Sharing a book with a followed reader from the share dialog" width="80%" />
</p>

### 📊 Reading stats

<img src="https://img.shields.io/badge/12--month%20activity-DB66A3?style=flat-square" alt="" /> <img src="https://img.shields.io/badge/Top%20genres%20%26%20authors-FFB7EE?style=flat-square" alt="" /> <img src="https://img.shields.io/badge/Rating%20patterns-DB66A3?style=flat-square" alt="" />

The stats page gives you a closer look at your reading life:

- **Pages read**, **average rating** and **favorites** at a glance;
- **Books by status** and **rating distribution**;
- **Library and review activity** over the last 12 months;
- **Top genres** and **most-read authors**.

<p align="center">
  <img src="docs/screenshots/stats.gif" alt="The reading stats page" width="80%" />
</p>

### ⚙️ Account

The Account page holds your **profile editor** (photo up to 2 MB and bio), your followers and following lists, the **AI personalization** switch, **keyboard shortcuts**, links to the legal pages, and **permanent account deletion**.

### 🎨 Look & feel

- An **animated landing page** under a starry sky that introduces Shelfie chapter by chapter, with a live demo of the chat.
- **Light and dark themes**, each with its own palette, plus a "follow the system" option.
- **Responsive** from phones to wide screens.
- Thoughtful loading and empty states, friendly error messages with retry, and a custom 404 page.

<p align="center"><img src="docs/assets/divider.svg" alt="" width="60%" /></p>

## 🔮 How recommendations work

<p align="center">
  <img src="https://img.shields.io/badge/Your%20shelf-DB66A3?style=for-the-badge" alt="Your shelf" />
  ➜
  <img src="https://img.shields.io/badge/Gemini-DB66A3?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Gemini" />
  ➜
  <img src="https://img.shields.io/badge/Google%20Books-DB66A3?style=for-the-badge&logo=googlebooks&logoColor=white" alt="Google Books" />
  ➜
  <img src="https://img.shields.io/badge/6%20verified%20picks-DB66A3?style=for-the-badge" alt="6 verified picks" />
</p>

<img src="https://img.shields.io/badge/1-Reading%20profile-FFB7EE?style=flat-square&labelColor=DB66A3" alt="Step 1" />

Shelfie gathers your signals and gives each one a weight. What you **wrote in your reviews** counts the most, followed by **ratings**, **favorites** and **reading status** (abandoned counts as a negative). Recurring authors, themes and genre come after that, and the wishlist is the lightest hint. A harsh review outweighs a simple genre match.

<img src="https://img.shields.io/badge/2-Generation-FFB7EE?style=flat-square&labelColor=DB66A3" alt="Step 2" />

Gemini proposes a set of candidates, split between well-known and lesser-known books, each with a short reason. It skips anything already in your library, on your wishlist, marked *Not interested* or shown recently. If a model stalls, a fallback model takes over.

<img src="https://img.shields.io/badge/3-Verification-FFB7EE?style=flat-square&labelColor=DB66A3" alt="Step 3" />

Each candidate is matched against Google Books by title and author. Only books that match make it to your screen.

<img src="https://img.shields.io/badge/4-Memory-FFB7EE?style=flat-square&labelColor=DB66A3" alt="Step 4" />

The final set is cached until you ask for a new one, with a short cooldown between refreshes.

<p align="center"><img src="docs/assets/divider.svg" alt="" width="60%" /></p>

## 🔒 Privacy & safety

<img src="https://img.shields.io/badge/AI%20off%20by%20default-DB66A3?style=flat-square" alt="" /> <img src="https://img.shields.io/badge/Row%20Level%20Security-FFB7EE?style=flat-square" alt="" /> <img src="https://img.shields.io/badge/18%2B%20consent-DB66A3?style=flat-square" alt="" /> <img src="https://img.shields.io/badge/Account%20deletion-FFB7EE?style=flat-square" alt="" />

- **AI is off by default.** A single switch in **Account** controls both recommendations and the chat. While it's off, none of your reading data is sent to Gemini.
- **You choose what's public**, book by book and review by review. The wishlist is always private.
- **Row Level Security** on every table, so each reader can only read and change what they're allowed to.
- Reviews and book descriptions are treated as **data, not instructions**, so text inside them can't hijack the AI.
- **Privacy Policy and Terms of Use**, with explicit acceptance and an **18+ confirmation** at sign-up.
- **Delete your account** permanently whenever you want.
- The chat is limited to **20 messages per conversation** and **1,200 characters per message**.

<p align="center"><img src="docs/assets/divider.svg" alt="" width="60%" /></p>

## ♿ Accessibility

<img src="https://img.shields.io/badge/Full%20keyboard%20navigation-DB66A3?style=flat-square" alt="" /> <img src="https://img.shields.io/badge/Focus--trapped%20dialogs-FFB7EE?style=flat-square" alt="" /> <img src="https://img.shields.io/badge/Optional%20shortcuts-DB66A3?style=flat-square" alt="" />

Shelfie can be used **entirely from the keyboard**. It has visible focus states, dialogs that keep focus inside them, keyboard-friendly star ratings and labelled controls throughout.

For faster navigation, you can turn on **keyboard shortcuts** in Account:

| Keys | Action |
|---|---|
| <kbd>g</kbd> then <kbd>d</kbd> · <kbd>r</kbd> · <kbd>c</kbd> · <kbd>l</kbd> · <kbd>w</kbd> | Dashboard · For you · AI chat · Library · Wishlist |
| <kbd>g</kbd> then <kbd>s</kbd> · <kbd>t</kbd> · <kbd>p</kbd> · <kbd>n</kbd> · <kbd>a</kbd> | Shared books · Stats · Profiles · Notifications · Account |
| <kbd>/</kbd> | Focus the search box |
| <kbd>?</kbd> | Show all shortcuts |
| <kbd>Esc</kbd> | Close a menu or dialog |

<p align="center"><img src="docs/assets/divider.svg" alt="" width="60%" /></p>

## 🌱 Development process

<img src="https://img.shields.io/badge/Supabase%20migrations-26-FFB7EE?style=flat-square&labelColor=DB66A3" alt="26 Supabase migrations" /> <img src="https://img.shields.io/badge/Commits-conventional-FFB7EE?style=flat-square&labelColor=DB66A3" alt="Conventional commits" />

Shelfie was built **one feature at a time**, and each step left a working app behind. It went from a secure foundation (auth and Row Level Security) to the core reading loop (search, library, reviews), then the social layer, then a full visual redesign. The AI came last, so it could build on everything readers had already added. The final stretch went into polish: legal pages, account deletion, accessibility and the landing page.

**Highlights:**

- **Versioned database:** every schema and policy change lives in a Supabase migration.
- **Defensive AI pipeline:** model output is streamed, validated and matched against Google Books, with a fallback model and a deadline.
- **Tested logic:** book matching, stream parsing and keyboard shortcuts have unit tests.

<p align="center"><img src="docs/assets/divider.svg" alt="" width="60%" /></p>

## 🧰 Tech stack

| Area | Technology |
|---|---|
| Framework | <img src="https://img.shields.io/badge/Next.js-DB66A3?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js" /> <img src="https://img.shields.io/badge/React%2019-DB66A3?style=flat-square&logo=react&logoColor=white" alt="React 19" /> <img src="https://img.shields.io/badge/TypeScript-DB66A3?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" /> |
| Styling | <img src="https://img.shields.io/badge/Tailwind%20CSS-DB66A3?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" /> <img src="https://img.shields.io/badge/shadcn%2Fui-DB66A3?style=flat-square&logo=shadcnui&logoColor=white" alt="shadcn/ui" /> <img src="https://img.shields.io/badge/CSS%20animations-FFB7EE?style=flat-square&logo=css&logoColor=white" alt="CSS animations" /> |
| Auth & database | <img src="https://img.shields.io/badge/Supabase-DB66A3?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" /> <img src="https://img.shields.io/badge/PostgreSQL-DB66A3?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" /> <img src="https://img.shields.io/badge/Row%20Level%20Security-FFB7EE?style=flat-square" alt="Row Level Security" /> |
| Book data | <img src="https://img.shields.io/badge/Google%20Books%20API-DB66A3?style=flat-square&logo=googlebooks&logoColor=white" alt="Google Books API" /> |
| AI | <img src="https://img.shields.io/badge/Google%20Gemini-DB66A3?style=flat-square&logo=googlegemini&logoColor=white" alt="Google Gemini" /> |
| Hosting | <img src="https://img.shields.io/badge/Vercel-DB66A3?style=flat-square&logo=vercel&logoColor=white" alt="Vercel" /> |

<p align="center"><img src="docs/assets/divider.svg" alt="" width="60%" /></p>

## 🛠️ Running locally

<img src="https://img.shields.io/badge/Node.js-20%2B-FFB7EE?style=flat-square&labelColor=DB66A3&logo=nodedotjs&logoColor=white" alt="Node.js 20+" /> <img src="https://img.shields.io/badge/npm-run%20dev-FFB7EE?style=flat-square&labelColor=DB66A3&logo=npm&logoColor=white" alt="npm run dev" />

<details>
<summary><strong>Setup instructions</strong></summary>

<br />

**Requirements:** Node.js 20+, a Supabase project with the migrations in [`supabase/migrations`](supabase/migrations) applied, and API keys for Google Books and Gemini.

Create a `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SECRET_KEY=your_supabase_secret_key   # used for account deletion
GOOGLE_BOOKS_API_KEY=your_google_books_api_key
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.5-flash-lite              # optional
```

Then:

```bash
npm install
npm run dev        # http://localhost:3000
```

Checks:

```bash
npm run lint
npm test
npm run build
```

</details>

<br />

<p align="center">
  <img src="docs/assets/divider.svg" alt="" width="40%" />
  <br />
  <em>✦ Built one page, one feature, and one book at a time. ✦</em>
</p>
