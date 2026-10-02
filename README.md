# obsidian-personal-accounts
Track personal receivables and debts with multi-currency support, Jalali/Gregorian calendars, and rich transaction management.

> **Manage personal accounts, debts, receivables, and transactions directly in Obsidian.**
> > **مدیریت حساب‌های شخصی، بدهی‌ها، طلب‌ها و تراکنش‌ها در ابسیدین**


[English](#english) · [فارسی](#فارسی)

---

<a name="english"></a>

# 🇬🇧 English

## Personal Accounts

**Personal Accounts** is an [Obsidian](https://obsidian.md/) plugin for managing personal accounts, debts, receivables, payments, and transactions directly inside your Obsidian vault.

Instead of keeping your personal financial records in separate applications or spreadsheets, Personal Accounts lets you manage them as **editable Markdown-based records inside Obsidian**.

Whether someone owes you money or you owe someone else, you can keep track of the entire balance and payment history in one place.

---

## ✨ Features

* 👤 Manage people and personal accounts
* 💰 Record debts and receivables
* 🧾 Record financial transactions
* 💳 Support partial payments
* ✅ Mark accounts as fully settled
* 📊 Automatically calculate remaining balances
* ⚖️ Calculate the net balance between two people
* 🔎 Search people and transactions
* 📥 Track money you owe
* 📤 Track money owed to you
* 🔢 Format amounts with thousands separators
* 🔤 Support Persian and English digits
* 💵 Support for تومان (Toman)
* 📝 Store records as editable Markdown notes
* 📱 Desktop and mobile support
* 🌐 Persian and English interface

---

## 💳 Partial Payments

You don't have to settle an account in a single payment.

For example:

```text
Original balance: 5,000,000 تومان

Payment 1: 1,000,000 تومان
Payment 2: 1,500,000 تومان

Remaining balance: 2,500,000 تومان
```

Personal Accounts keeps track of payments and automatically calculates the remaining balance.

---

## ⚖️ Personal Account Balance

Personal Accounts can calculate the net balance between you and another person.

For example:

```text
They owe you:       3,000,000 تومان
You owe them:       1,000,000 تومان
--------------------------------
Net balance:        2,000,000 تومان
```

This gives you a clearer view of the actual balance instead of having to manually compare individual transactions.

---

## 📝 Markdown-Based Records

Personal Accounts is designed around the philosophy of Obsidian:

**Your data belongs in your vault.**

Records are stored as Markdown notes, allowing you to open and edit them directly in Obsidian.

Your data remains:

* Portable
* Editable
* Searchable
* Human-readable
* Compatible with Obsidian
* Under your control

You can also use Obsidian's own search and other plugins with your account records.

---

## 📱 Mobile Support

Personal Accounts is designed to work on both **Obsidian Desktop and Obsidian Mobile**.

You can manage your accounts and transactions directly from your phone without needing a separate financial application.

---

## 🚀 Installation

### From Community Plugins

1. Open **Settings** in Obsidian.
2. Go to **Community plugins**.
3. Select **Browse**.
4. Search for **Personal Accounts**.
5. Click **Install**.
6. Enable the plugin.

### Manual Installation

Download the latest release and place the plugin files inside:

```text
.obsidian/plugins/personal-accounts/
```

Then enable **Personal Accounts** from:

```text
Settings → Community plugins
```

---

## ⚡ Commands

Personal Accounts provides commands for common actions, including:

* Open Dashboard
* Add Transaction
* Add Person
* Search Transactions

You can assign custom keyboard shortcuts to these commands through Obsidian's **Hotkeys** settings.

---

## 🎛️ Ribbon

Personal Accounts also provides quick-access buttons in the Obsidian Ribbon for frequently used actions.

This makes it possible to access your dashboard and transaction entry without opening the Command Palette.

---

## 🔐 Privacy

Personal Accounts is designed to keep your financial records inside your Obsidian vault.

The plugin does not require your financial data to be uploaded to an external server for its core functionality.

Your account records remain in your vault and are managed as local Markdown files.

---

## 🛠️ Development

Clone the repository and install dependencies:

```bash
npm install
```

Build the plugin:

```bash
npm run build
```

For development:

```bash
npm run dev
```

---

## 🤝 Contributing

Suggestions, bug reports, feature requests, and contributions are welcome.

If you find a problem or have an idea for improving Personal Accounts, feel free to open an issue or submit a pull request.

---

## 📜 License

See the repository's license for details.

---

<a name="فارسی"></a>

# 🇮🇷 فارسی

## Personal Accounts

**Personal Accounts** یک پلاگین برای **Obsidian** است که برای مدیریت حساب‌های شخصی، بدهی‌ها، طلب‌ها، پرداخت‌ها و تراکنش‌های مالی طراحی شده است.

به‌جای اینکه اطلاعات حساب‌های خود را در برنامه‌های جداگانه یا فایل‌های Excel نگهداری کنید، می‌توانید همه چیز را مستقیماً داخل **Vault ابسیدین** مدیریت کنید.

اطلاعات به‌صورت یادداشت‌های Markdown ذخیره می‌شوند و می‌توانید آن‌ها را مستقیماً در Obsidian مشاهده و ویرایش کنید.

---

## ✨ امکانات

* 👤 مدیریت افراد و حساب‌های شخصی
* 💰 ثبت بدهی و طلب
* 🧾 ثبت تراکنش‌های مالی
* 💳 پشتیبانی از پرداخت‌های جزئی
* ✅ ثبت تسویه کامل حساب
* 📊 محاسبه خودکار مبلغ باقی‌مانده
* ⚖️ محاسبه خالص حساب بین دو نفر
* 🔎 جست‌وجوی افراد و تراکنش‌ها
* 📥 مشاهده مبالغی که شما بدهکار هستید
* 📤 مشاهده مبالغی که دیگران به شما بدهکار هستند
* 🔢 نمایش مبالغ با جداکننده سه‌رقمی
* 🔤 پشتیبانی از اعداد فارسی و انگلیسی
* 💵 پشتیبانی از تومان
* 📝 ذخیره اطلاعات به‌صورت یادداشت‌های Markdown قابل ویرایش
* 📱 پشتیبانی از Obsidian Desktop و Mobile
* 🌐 رابط کاربری فارسی و انگلیسی

---

## 💳 پرداخت‌های جزئی

برای تسویه یک حساب لازم نیست تمام مبلغ را یک‌جا پرداخت کنید.

مثلاً:

```text
مبلغ اولیه:       ۵,۰۰۰,۰۰۰ تومان

پرداخت اول:       ۱,۰۰۰,۰۰۰ تومان
پرداخت دوم:       ۱,۵۰۰,۰۰۰ تومان

باقی‌مانده:       ۲,۵۰۰,۰۰۰ تومان
```

Personal Accounts پرداخت‌ها را ثبت می‌کند و مبلغ باقی‌مانده را به‌صورت خودکار محاسبه می‌کند.

---

## ⚖️ محاسبه خالص حساب

پلاگین می‌تواند حساب بین شما و یک شخص را در نظر بگیرد و خالص حساب را محاسبه کند.

مثلاً:

```text
طلب شما از شخص:       ۳,۰۰۰,۰۰۰ تومان
بدهی شما به شخص:      ۱,۰۰۰,۰۰۰ تومان
-------------------------------------
خالص حساب:             ۲,۰۰۰,۰۰۰ تومان
```

به این ترتیب می‌توانید به‌جای بررسی تک‌تک تراکنش‌ها، وضعیت نهایی حساب خود با هر شخص را ببینید.

---

## 📝 اطلاعات به‌صورت Markdown

Personal Accounts با فلسفه اصلی Obsidian هماهنگ است:

> **اطلاعات شما باید داخل Vault خودتان باشد.**

سوابق حساب‌ها به‌صورت فایل‌های Markdown ذخیره می‌شوند؛ بنابراین می‌توانید آن‌ها را مستقیماً در Obsidian باز کنید و تغییر دهید.

اطلاعات شما:

* قابل انتقال است
* قابل ویرایش است
* قابل جست‌وجو است
* خوانا و قابل فهم است
* با ساختار Obsidian سازگار است
* تحت کنترل خود شماست

همچنین می‌توانید از قابلیت Search خود Obsidian و سایر پلاگین‌ها برای کار با این اطلاعات استفاده کنید.

---

## 📱 پشتیبانی از موبایل

Personal Accounts برای **Obsidian دسکتاپ و Obsidian موبایل** طراحی شده است.

بنابراین می‌توانید حساب‌ها و تراکنش‌های خود را مستقیماً از گوشی مدیریت کنید.

---

## 🚀 نصب

### نصب از Community Plugins

1. وارد **Settings** ابسیدین شوید.
2. وارد بخش **Community plugins** شوید.
3. گزینه **Browse** را انتخاب کنید.
4. عبارت **Personal Accounts** را جست‌وجو کنید.
5. روی **Install** بزنید.
6. پلاگین را فعال کنید.

### نصب دستی

آخرین نسخه پلاگین را دانلود کرده و فایل‌های آن را در مسیر زیر قرار دهید:

```text
.obsidian/plugins/personal-accounts/
```

سپس از مسیر زیر پلاگین را فعال کنید:

```text
Settings → Community plugins
```

---

## ⚡ دستورات

Personal Accounts برای دسترسی سریع به امکانات مختلف، Commandهای زیر را در اختیار شما قرار می‌دهد:

* باز کردن داشبورد
* ثبت تراکنش
* افزودن شخص
* جست‌وجوی تراکنش‌ها

همچنین می‌توانید برای هر Command از بخش **Hotkeys** ابسیدین میانبر دلخواه خود را تعیین کنید.

---

## 🎛️ ریبون

Personal Accounts برای دسترسی سریع‌تر، دکمه‌هایی را در **Ribbon** ابسیدین در اختیار شما قرار می‌دهد.

به کمک این دکمه‌ها می‌توانید بدون باز کردن Command Palette به بخش‌هایی مانند داشبورد و ثبت تراکنش دسترسی داشته باشید.

---

## 🔐 حریم خصوصی

Personal Accounts برای نگهداری اطلاعات مالی شما داخل Vault ابسیدین طراحی شده است.

برای عملکرد اصلی پلاگین، نیازی به ارسال اطلاعات مالی شما به سرور خارجی وجود ندارد.

اطلاعات حساب‌ها در Vault شما باقی می‌مانند و به‌صورت فایل‌های Markdown محلی مدیریت می‌شوند.

---

## 🛠️ توسعه

برای دریافت پروژه:

```bash
npm install
```

برای ساخت نسخه Production:

```bash
npm run build
```

برای توسعه:

```bash
npm run dev
```

---

## 🤝 مشارکت

پیشنهادها، گزارش خطا، درخواست قابلیت جدید و مشارکت در توسعه پلاگین خوش‌آمد هستند.

اگر مشکلی پیدا کردید یا ایده‌ای برای بهتر شدن Personal Accounts دارید، می‌توانید یک Issue ایجاد کنید یا Pull Request ارسال کنید.

---

## 📜 مجوز

برای اطلاعات مربوط به مجوز استفاده و انتشار، به فایل License موجود در مخزن پروژه مراجعه کنید.

---

# 🇮🇷 درباره سازنده

این پلاگین بخشی از پروژه‌های آموزشی و توسعه ابزارهای کاربردی برای **Obsidian و مدیریت دانش شخصی (PKM)** است.

اگر به آموزش‌های فارسی Obsidian، معرفی پلاگین‌ها، شخصی‌سازی، مدیریت دانش شخصی و ترفندهای کاربردی ابسیدین علاقه‌مند هستید، می‌توانید ما را دنبال کنید.

### آموزش کاربردی ابسیدین

📌 آموزش Obsidian از پایه تا پیشرفته
📌 معرفی و آموزش پلاگین‌های کاربردی
📌 ترفندها و شخصی‌سازی Obsidian
📌 مدیریت دانش شخصی و PKM
📌 ابزارها و روش‌های کاربردی برای ساخت یک Vault حرفه‌ای

### ما را دنبال کنید

**Telegram:** `@obsidiantut`

**Bale:** `@obsidiantut`

**YouTube:** `@obsidiantut`

---

<p align="center">

### آموزش کاربردی ابسیدین

**ساخته‌شده با ❤️ برای کاربران Obsidian**

</p>
