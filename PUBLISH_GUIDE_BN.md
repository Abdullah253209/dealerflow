# GitHub-এ DealerFlow প্রকাশ করুন

এই ZIP-এ source code, পরীক্ষা, README, MIT লাইসেন্স এবং GitHub Actions workflow আছে। GitHub-এ account থাকলেই নিজের repository-তে প্রকাশ করতে পারবেন।

## ১. Repository তৈরি করুন

1. [GitHub](https://github.com/new)-এ গিয়ে নতুন repository তৈরি করুন।
2. Repository name দিন: **dealerflow**।
3. Description দিতে পারেন:

> A free, bilingual sales and collection tracker for small distributors. English/Bangla UI, dealer balances, monthly targets, CSV reports and local backups.

4. Visibility **Public** করুন।
5. এই প্যাকেজে README ও LICENSE আছে, তাই নতুন করে সেগুলো তৈরি করার checkbox দেবেন না।
6. **Create repository** চাপুন।

## ২. ফাইল আপলোড করুন

1. ZIP ফাইলটি Extract করুন।
2. `dealerflow` ফোল্ডারের **ভেতরের সব ফাইল ও ফোল্ডার** আপলোড করবেন। সম্পূর্ণ `dealerflow` ফোল্ডার আরেকটি স্তর হিসেবে দেবেন না।
3. GitHub-এ **uploading an existing file** অথবা **Add file → Upload files** বেছে নিন।
4. সব source ফাইল দিন; `.github` ফোল্ডারটিও দিন।
5. Commit message লিখুন: `Release DealerFlow v1.0.0`।
6. Commit করুন। Branch-এর নাম `main` রাখুন।

আপলোডের পর repository root-এ `index.html`, `package.json`, `README.md`, `LICENSE`, `assets`, `scripts`, `tests` ও `.github` দেখা উচিত। `dist`, `node_modules` বা নিজের ব্যবসার backup ফাইল আপলোড করতে হবে না।

## ৩. লাইভ অ্যাপ চালু করুন — সহজ পদ্ধতি

1. Repository-র **Settings → Pages**-এ যান।
2. **Build and deployment → Source** থেকে **Deploy from a branch** বেছে নিন।
3. Branch দিন **main**, folder দিন **/ (root)**।
4. **Save** চাপুন।
5. Pages deployment শেষ হলে একই Settings → Pages-এ live URL পাবেন। সাধারণত URL হবে:

```text
https://YOUR_USERNAME.github.io/dealerflow/
```

`YOUR_USERNAME`-এর জায়গায় নিজের GitHub username হবে। এই পদ্ধতিতে ভবিষ্যতে `main` branch-এ code পরিবর্তন commit করলে live site আবার update হবে। নিজের কম্পিউটারে Node.js install না করেও এভাবে প্রকাশ করতে পারবেন।

### ঐচ্ছিক বিকল্প — GitHub Actions দিয়ে build ও deploy

শুধু built app assets deploy করতে চাইলে Pages Source দিন **GitHub Actions**। এরপর **Actions → Deploy demo to GitHub Pages → Run workflow → main** চালান। এই বিকল্পে পরের update প্রকাশ করতেও workflow আবার চালাতে হবে। মূল সহজ পদ্ধতি অনুসরণ করলে এটি আলাদা করে চালানোর দরকার নেই।

## ৪. Repository পরিপাটি করুন

- README-র clone URL-এ `YOUR_USERNAME` বদলে নিজের username দিন।
- Repository-র About অংশে live site-এর URL দিন।
- Topics দিতে পারেন: `sales-tracker`, `bangla`, `small-business`, `local-first`, `javascript`, `open-source`।
- Browser-এ demo খুলে দেখে নিন। [করা পরীক্ষার ফল](docs/BROWSER_QA.md) ও [বাকি পরীক্ষার তালিকা](docs/MANUAL_TESTING.md) আছে।
- প্রয়োজন হলে নিজের screenshot তুলে README-তে দিন।
- GitHub Releases থেকে `v1.0.0` নামে প্রথম release দিন; [CHANGELOG](CHANGELOG.md)-এর বিবরণ ব্যবহার করতে পারবেন।
- ব্যবহারকারীর feedback পেলে issue খুলুন, bug fix করুন এবং পরের release দিন।

## ৫. Codex for Open Source-এ আবেদন

শুধু repository প্রকাশ করলেই অনুমোদন নিশ্চিত হয় না। এটি নতুন project; ব্যবহার, অবদান ও নিয়মিত রক্ষণাবেক্ষণের প্রমাণ তৈরি হলে আপনার আবেদনের ব্যাখ্যা আরও শক্ত হবে। প্রকাশের পরে কেবল সত্য ও যাচাইযোগ্য তথ্য দিন।

অফিশিয়াল ফর্ম: https://openai.com/form/codex-for-oss/

**Primary maintainer** বেছে নেবেন যদি আপনি নিজে এই project-এর code, issue, release ও রক্ষণাবেক্ষণের দায়িত্ব নেন।

**Why does this repository qualify?** ঘরের জন্য project প্রকাশ ও নিজের যাচাই শেষ করার পর ব্যবহারযোগ্য প্রাথমিক খসড়া:

> DealerFlow is an early-stage, MIT-licensed English/Bangla sales and collection tracker for small distributors. It offers dealer ledgers, monthly targets, reconciliation reports, CSV import and local backups without a backend. The repository includes automated accounting tests and contribution guides. I am seeking initial users and feedback; I do not yet have meaningful adoption metrics.

এই খসড়াটি ৫০০ অক্ষরের মধ্যে। পরে বাস্তব stars, users বা downloads থাকলে সত্য সংখ্যা অনুযায়ী বদলাবেন। নতুন অবস্থায় গুরুত্বপূর্ণ ecosystem adoption আছে বলে দাবি করবেন না।

**How will you use API credits?** ঘরে পরিকল্পনা হিসেবে লিখতে পারেন, যদি সেটিই আপনার বাস্তব উদ্দেশ্য হয়:

> I plan to evaluate Codex-assisted pull request review, regression-test generation and bilingual documentation maintenance for DealerFlow. Credits would support these maintainer workflows. The current application has no OpenAI API integration, and its core tracking features work without API access.

এটিও ৫০০ অক্ষরের মধ্যে। এই খসড়া অনুমোদনের নিশ্চয়তা নয়; form-এর বর্তমান প্রশ্ন ও নিজের বাস্তব কাজ অনুযায়ী সম্পাদনা করুন।

কোনো OpenAI logo, official endorsement, ভুয়া usage statistics, কেনা stars বা সাজানো activity এই project-এ যোগ করা হয়নি।
