"use strict";
const {
	Plugin,
	ItemView,
	Modal,
	Notice,
	PluginSettingTab,
	Setting,
	TFile,
	normalizePath,
	setIcon
} = require("obsidian");
const VIEW_TYPE_PERSONAL_ACCOUNTS = "personal-accounts-view";
const DATA_VERSION = 4;
const DEFAULT_FILE_PATH = "Personal Accounts.md";
const EPS = 1e-6;
const CURRENCIES = [{
	code: "usd",
	label: "USD",
	labelFa: "دلار",
	symbol: "$"
}, {
	code: "toman",
	label: "Toman",
	labelFa: "تومان",
	symbol: "ت"
}, {
	code: "rial",
	label: "Rial",
	labelFa: "ریال",
	symbol: "ر"
}, {
	code: "eur",
	label: "EUR",
	labelFa: "یورو",
	symbol: "€"
}, {
	code: "gbp",
	label: "GBP",
	labelFa: "پوند",
	symbol: "£"
}, {
	code: "aed",
	label: "AED",
	labelFa: "درهم",
	symbol: "د.إ"
}, {
	code: "try",
	label: "TRY",
	labelFa: "لیر",
	symbol: "₺"
}, {
	code: "cny",
	label: "CNY",
	labelFa: "یوان",
	symbol: "¥"
}, {
	code: "jpy",
	label: "JPY",
	labelFa: "ین",
	symbol: "¥"
}, {
	code: "cad",
	label: "CAD",
	labelFa: "دلار کانادا",
	symbol: "C$"
}, {
	code: "aud",
	label: "AUD",
	labelFa: "دلار استرالیا",
	symbol: "A$"
}, {
	code: "chf",
	label: "CHF",
	labelFa: "فرانک",
	symbol: "Fr"
}, {
	code: "sek",
	label: "SEK",
	labelFa: "کرون سوئد",
	symbol: "kr"
}, {
	code: "rub",
	label: "RUB",
	labelFa: "روبل",
	symbol: "₽"
}, {
	code: "inr",
	label: "INR",
	labelFa: "روپیه",
	symbol: "₹"
}];
const DEFAULT_CATEGORIES_FA = ["وام", "خرید", "خدمات", "کار", "خانواده", "دوستان", "سایر"];
const DEFAULT_CATEGORIES_EN = ["Loan", "Purchase", "Service", "Work", "Family", "Friends", "Other"];
const VALID_TYPES = ["receivable", "debt", "payment_received", "payment_made"];
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
const STRINGS = {
	fa: {
		appTitle: "حساب‌های شخصی",
		tabDashboard: "داشبورد",
		tabPeople: "افراد",
		tabTransactions: "تراکنش‌ها",
		tabAnalytics: "تحلیل",
		addTx: "+ تراکنش",
		reload: "بازخوانی از فایل",
		statTotalRec: "مطالبات کل",
		statTotalDebt: "بدهی‌های کل",
		statNet: "مانده خالص",
		statPeople: "افراد",
		statUnsettled: "حساب‌های باز",
		statSettled: "تسویه‌شده",
		statOverdue: "سررسید گذشته",
		statDueSoon: "نزدیک سررسید",
		upcoming: "سررسیدها و عقب‌افتاده‌ها",
		nothingDue: "چیزی برای پیگیری نیست — همه‌چیز مرتب است.",
		getStarted: "برای شروع، با دکمهٔ «+ تراکنش» اولین طلب یا بدهی را ثبت کنید.",
		peopleCard: "افراد",
		viewAll: "مشاهدهٔ همه",
		searchPeople: "جستجوی افراد…",
		addPersonBtn: "افزودن شخص",
		noPeople: "شخصی یافت نشد.",
		settled: "تسویه‌شده",
		noBalance: "—",
		receivable: "طلب",
		debt: "بدهی",
		back: "→ بازگشت",
		recRemaining: "مانده مطالبات",
		debtRemaining: "مانده بدهی‌ها",
		net: "خالص",
		addRec: "+ طلب",
		addDebt: "+ بدهی",
		recordPayment: "ثبت پرداخت",
		settleAccount: "تسویهٔ حساب",
		deletePersonBtn: "حذف شخص",
		history: "تاریخچهٔ تراکنش‌ها",
		noTx: "هنوز تراکنشی ثبت نشده است.",
		remainingLabel: "باقیمانده:",
		addPersonTitle: "افزودن شخص",
		editPersonTitle: "ویرایش شخص",
		fName: "نام *",
		phName: "نام کامل",
		fPhone: "تلفن",
		phPhone: "مثلاً ۰۹۱۲۳۴۵۶۷۸۹",
		fEmail: "ایمیل",
		phEmail: "name@example.com",
		fTags: "برچسب‌ها",
		phTags: "خانواده، همکار، دوست",
		fTagsHint: "با کاما یا ، از هم جدا کنید.",
		fNote: "یادداشت",
		phNote: "یادداشت کامل دربارهٔ این شخص…",
		personInfoTitle: "اطلاعات تماس",
		noExtraInfo: "اطلاعاتی ثبت نشده است.",
		nameRequired: "نام الزامی است.",
		personSaved: "شخص ذخیره شد",
		save: "ذخیره",
		cancel: "انصراف",
		addTxTitle: "افزودن تراکنش",
		editTxTitle: "ویرایش تراکنش",
		fType: "نوع",
		typeReceivable: "طلب",
		typeDebt: "بدهی",
		typePaymentReceived: "دریافت شد",
		typePaymentMade: "پرداخت شد",
		fPerson: "شخص *",
		phPerson: "نام را بنویسید — نام تازه خودکار ساخته می‌شود",
		personRequired: "نام شخص الزامی است.",
		fAmount: "مبلغ *",
		phAmount: "مثلاً ۵٬۰۰۰٬۰۰۰",
		amountInvalid: "یک مبلغ معتبر و بزرگ‌تر از صفر وارد کنید.",
		fDate: "تاریخ",
		fDue: "سررسید (اختیاری)",
		fCategory: "دسته",
		noCategory: "— بدون دسته —",
		fDesc: "شرح / دلیل",
		phDesc: "دلیل / شرح",
		txAdded: "تراکنش ثبت شد",
		txUpdated: "تراکنش به‌روزرسانی شد",
		pickDate: "انتخاب تاریخ…",
		todayBtn: "امروز",
		clearBtn: "پاک کردن",
		statusOpen: "باز",
		statusPartial: "بخشی پرداخت شد — {amt} باقیمانده",
		dPerson: "شخص",
		dAmount: "مبلغ",
		dDate: "تاریخ",
		dStatus: "وضعیت",
		dDue: "سررسید",
		dCategory: "دسته",
		dDesc: "شرح",
		dLinked: "پیوند با",
		edit: "ویرایش",
		delete: "حذف",
		settleRemaining: "تسویهٔ باقی‌مانده",
		settleTxTitle: "تسویهٔ تراکنش",
		settleRecLine: "ثبت «دریافت شد» به مبلغ {amt} از {name}؟",
		settleDebtLine: "ثبت «پرداخت شد» به مبلغ {amt} به {name}؟",
		settleNote: "تسویه به‌صورت یک تراکنش پرداخت جدید ثبت می‌شود و رکورد اصلی دست‌نخورده می‌ماند.",
		settle: "تسویه",
		deleteTxTitle: "حذف تراکنش؟",
		deleteTxNote: "این عمل قابل بازگشت نیست.",
		txDeleted: "تراکنش حذف شد",
		confirm: "تأیید",
		deletePersonTitle: "حذف شخص؟",
		deletePersonLine: "«{name}» و همهٔ تراکنش‌های او حذف شود؟",
		settleFor: "تسویهٔ {id}",
		accountSettlement: "تسویهٔ حساب",
		dueOverdue1: "سررسید گذشته (۱ روز)",
		dueOverdueN: "سررسید گذشته ({n} روز)",
		dueToday: "سررسید امروز",
		dueTomorrow: "سررسید فردا",
		dueInN: "سررسید تا {n} روز دیگر",
		filterAll: "همه",
		filterRec: "مطالبات",
		filterDebt: "بدهی‌ها",
		filterSettled: "تسویه‌شده",
		filterUnsettled: "تسویه‌نشده",
		filterOverdue: "سررسید گذشته",
		filterDueSoon: "نزدیک سررسید",
		filterCategory: "همهٔ دسته‌ها",
		sortNewest: "جدیدترین",
		sortOldest: "قدیمی‌ترین",
		sortHighest: "بیشترین مبلغ",
		sortLowest: "کمترین مبلغ",
		sortDue: "نزدیک‌ترین سررسید",
		searchTx: "جستجو: نام، شرح، مبلغ… (مثال: type:receivable category:وام)",
		noTxMatch: "تراکنشی یافت نشد.",
		dataProblem: "مشکل در فایل داده",
		unknownError: "خطای نامشخص.",
		retry: "تلاش دوباره",
		setStorage: "ذخیره‌سازی",
		setCentralFile: "فایل یادداشت اصلی",
		setCentralFileDesc: "فایل مارک‌داونی که داده‌ها در آن ذخیره می‌شوند. این فایل را پاک نکنید.",
		openFile: "باز کردن فایل",
		setCurrency: "واحد پول",
		setCurrencyDesc: "مبالغ به‌صورت عدد ذخیره می‌شوند؛ واحد پول فقط برای نمایش است.",
		setLang: "زبان / ارقام",
		setCalendar: "تقویم",
		setCalendarDesc: "برای نمایش تعطیلات و رویدادها، در صورت نصب بودن پلاگین «Persian Calendar» به‌صورت خودکار از آن استفاده می‌شود.",
		calJalali: "شمسی (جلالی)",
		calGregorian: "میلادی",
		setDateFormat: "قالب تاریخ میلادی",
		setDateFormatDesc: "الگوها: YYYY، MMM، MM، DD",
		setCompact: "نمایش فشرده",
		setDueSoon: "بازهٔ «نزدیک سررسید» (روز)",
		setConfirmDel: "تأیید قبل از حذف",
		setOpenAfterAdd: "باز کردن داشبورد پس از افزودن سریع",
		setCategories: "دسته‌بندی‌های تراکنش",
		setCategoriesDesc: "هر دسته در یک خط. این دسته‌ها در فرم تراکنش نمایش داده می‌شوند.",
		setBackup: "پشتیبان‌گیری و خروجی",
		setExportJSON: "خروجی JSON",
		setExportJSONDesc: "داده‌ها را به‌صورت فایل JSON دانلود کنید (برای پشتیبان).",
		setExportCSV: "خروجی CSV (اکسل)",
		setExportCSVDesc: "خروجی CSV سازگار با اکسل — با پشتیبانی از فارسی.",
		setImportJSON: "ورود از JSON",
		setImportJSONDesc: "یک فایل JSON پشتیبان را بارگذاری کنید (جایگزین داده‌های فعلی می‌شود).",
		exportBtn: "دانلود",
		importBtn: "انتخاب فایل",
		exportDone: "فایل دانلود شد",
		importDone: "داده‌ها وارد شد",
		importError: "خطا در خواندن فایل",
		cmdOpen: "باز کردن داشبورد حساب‌ها",
		cmdAddTx: "افزودن تراکنش",
		cmdAddPerson: "افزودن شخص",
		cmdSearch: "جستجوی تراکنش‌ها",
		ribDashboard: "حساب‌های شخصی — داشبورد",
		ribQuickAdd: "حساب‌های شخصی — ثبت سریع تراکنش",
		openNote: "فایل اصلی",
		ledgerPeopleH: "افراد و مانده‌ها",
		ledgerTxH: "تراکنش‌ها",
		ledgerPeopleDetailsH: "افراد",
		thPerson: "شخص",
		thRec: "طلب",
		thDebt: "بدهی",
		thNet: "خالص",
		thId: "شناسه",
		thDate: "تاریخ",
		thType: "نوع",
		thAmount: "مبلغ",
		thDesc: "شرح",
		anaCharts: "نمودارها",
		anaReport: "گزارش ماهانه",
		anaCashflow: "جریان نقدی",
		chartTrend: "روند مطالبات و بدهی‌ها (تجمعی)",
		chartPie: "توزیع بر اساس دسته",
		chartBar: "مانده بر اساس شخص",
		repGot: "دریافت‌شده",
		repPaid: "پرداخت‌شده",
		repCount: "تعداد تراکنش",
		repTxList: "تراکنش‌های این ماه",
		repMonth: "ماه",
		cfWeek: "هفتهٔ آینده",
		cfMonth: "ماه آینده",
		cfQuarter: "سه ماه آینده",
		cfDetail: "جزئیات ۳۰ روز آینده",
		savedViews: "نمای ذخیره‌شده",
		saveView: "ذخیرهٔ نما",
		viewName: "نام نما:",
		viewSaved: "نما ذخیره شد",
		recurringDue: "قالب تکراری «{name}» امروز باید ثبت شود",
		reminderTitle: "⏰ یادآوری حساب‌ها",
		fileMissingWarn: "⚠️ فایل حساب‌های شخصی پیدا نشد! اگر آن را پاک کرده‌اید، داده‌ها از دست رفته‌اند.",
		tipDashboard: "نمای کلی موجودی، سررسیدها و افراد",
		tipPeople: "لیست همه افراد با اطلاعات تماس و مانده حساب",
		tipTransactions: "همه تراکنش‌ها با فیلتر، جستجو و مرتب‌سازی",
		tipAnalytics: "نمودارها، گزارش ماهانه و جریان نقدی",
		tipAddTx: "ثبت سریع یک طلب، بدهی یا پرداخت جدید",
		tipReload: "خواندن دوباره داده‌ها از فایل MD",
		tipOpenNote: "باز کردن فایل MD در ویرایشگر",
		tipSearchPeople: "جستجو بر اساس نام، تلفن، ایمیل، برچسب یا یادداشت",
		tipAddPerson: "افزودن شخص جدید با اطلاعات تماس",
		tipEditPerson: "ویرایش اطلاعات این شخص",
		tipDeletePerson: "حذف شخص و همه تراکنش‌های او",
		tipOpenPerson: "مشاهده پروفایل کامل و تراکنش‌ها",
		tipSettle: "تسویه کامل باقی‌مانده به‌صورت یک تراکنش جدید",
		tipRecordPayment: "ثبت دریافت یا پرداخت جزئی",
		tipAddRec: "ثبت طلب جدید از این شخص",
		tipAddDebt: "ثبت بدهی جدید به این شخص",
		tipTxRow: "کلیک برای مشاهده جزئیات، ویرایش یا حذف",
		tipStatRec: "مجموع پول‌هایی که دیگران به شما بدهکارند",
		tipStatDebt: "مجموع پول‌هایی که شما به دیگران بدهکارید",
		tipStatNet: "مطالبات منهای بدهی‌ها",
		tipStatPeople: "تعداد افرادی که تراکنش دارند",
		tipStatUnsettled: "افرادی که هنوز مانده حساب دارند",
		tipStatSettled: "افرادی که تسویه کامل شده‌اند",
		tipStatOverdue: "تراکنش‌هایی که سررسیدشان گذشته",
		tipStatDueSoon: "تراکنش‌هایی که نزدیک سررسید هستند",
		tipFilter: "فیلتر تراکنش‌ها بر اساس وضعیت",
		tipCategoryFilter: "فیلتر بر اساس دسته‌بندی",
		tipSort: "تغییر ترتیب نمایش",
		tipSaveView: "ذخیره فیلترها و جستجوی فعلی به‌عنوان یک نما",
		tipChartTrend: "مقایسه تجمعی مطالبات و بدهی‌ها در طول زمان",
		tipChartPie: "نسبت هر دسته از کل مبالغ",
		tipChartBar: "۱۰ شخص با بیشترین مانده خالص",
		tipDueChip: "وضعیت سررسید این تراکنش",
		tipSettleRemaining: "ثبت یک تراکنش پرداخت به اندازه باقی‌مانده",
		tipDatePicker: "انتخاب تاریخ از تقویم",
		tipAmount: "می‌توانید از جمع و تفریق هم استفاده کنید (مثلاً 1000+500)",
		tipAddButton: "ثبت تراکنش جدید",
		anaOverview: "نمای کلی",
		anaTrends: "روندها",
		anaBreakdown: "تحلیل تفصیلی",
		chartKpiRec: "نرخ وصول",
		chartKpiSettle: "نرخ تسویه",
		chartKpiAvg: "میانگین معامله",
		chartKpiGrowth: "رشد ماهانه",
		chartTrendCum: "روند تجمعی مطالبات و بدهی‌ها",
		chartTrendNet: "روند خالص (ماهانه)",
		chartAge: "سن مطالبات",
		chartTopDebtors: "بزرگ‌ترین بدهکاران",
		chartTopCreditors: "بزرگ‌ترین طلبکاران",
		chartHeatmap: "نقشه حرارتی فعالیت",
		chartRadial: "توزیع دسته‌ها (رادار)",
		chartWaterfall: "جریان نقدی تجمعی",
		chartPaymentSpeed: "سرعت پرداخت (روز)",
		chartCatCompare: "مقایسه طلب/بدهی بر اساس دسته",
		noData: "داده‌ای برای نمایش نیست",
		vsLastMonth: "نسبت به ماه قبل",
		days: "روز",
		count: "تعداد",
		ageFresh: "تازه (۰-۳۰)",
		ageMild: "ملایم (۳۱-۹۰)",
		ageOld: "قدیمی (۹۱-۱۸۰)",
		ageStale: "کهنه (۱۸۰+)",
		helpTitle: "راهنما",
		close: "بستن",
		helpKpiRec: "نرخ وصول: چه درصدی از مطالبات کل، دریافت شده است.",
		helpKpiSettle: "نرخ تسویه: چه درصدی از تراکنش‌ها کاملاً تسویه شده‌اند.",
		helpKpiAvg: "میانگین معامله: مبلغ متوسط همه تراکنش‌ها.",
		helpKpiGrowth: "رشد ماهانه: مقایسه حجم این ماه با ماه قبل.",
		helpTrendCum: "مجموع مطالبات و بدهی‌ها از ابتدا تا کنون، ماه به ماه.",
		helpTrendNet: "تفاضل مطالبات منهای بدهی‌ها در هر ماه. سبز یعنی طلبکار.",
		helpHeatmap: "هر خانه یک روز است. رنگ پررنگ‌تر یعنی تراکنش بیشتر در آن روز.",
		helpAge: "چه مدت است که پول‌ها دست مردم مانده. تازه خوب است، کهنه هشدار.",
		helpTopDebtors: "افرادی که بیشترین پول را به شما بدهکارند.",
		helpTopCreditors: "افرادی که شما بیشترین پول را به آن‌ها بدهکارید.",
		helpRadar: "مقایسه بصری حجم پول در دسته‌های مختلف.",
		helpWaterfall: "تجمع دریافت‌ها منهای پرداخت‌ها در طول زمان.",
		helpPaymentSpeed: "به طور میانگین چند روز طول می‌کشد تا یک طلب تسویه شود.",
		helpCatCompare: "در هر دسته چه مقدار طلب و چه مقدار بدهی دارید.",
		helpBarPerson: "خالص حساب هر فرد. سبز یعنی به شما بدهکار.",
		helpPie: "سهم هر دسته از کل مبالغ.",
		helpCashflowPeriods: "چه مقدار پول در هفته/ماه/فصل آینده باید دریافت یا پرداخت کنید.",
		helpCashflowDetail: "لیست همه سررسیدهای ۳۰ روز آینده.",
		helpMonthly: "خلاصه کامل یک ماه خاص با جمع دریافت/پرداخت."
	},
	en: {
		appTitle: "Personal Accounts",
		tabDashboard: "Dashboard",
		tabPeople: "People",
		tabTransactions: "Transactions",
		tabAnalytics: "Analytics",
		addTx: "+ Transaction",
		reload: "Reload from file",
		statTotalRec: "Total Receivables",
		statTotalDebt: "Total Debts",
		statNet: "Net Balance",
		statPeople: "People",
		statUnsettled: "Unsettled accounts",
		statSettled: "Settled",
		statOverdue: "Overdue",
		statDueSoon: "Due soon",
		upcoming: "Upcoming & overdue",
		nothingDue: "Nothing due — all clear.",
		getStarted: 'Get started: press "+ Transaction" to record your first receivable or debt.',
		peopleCard: "People",
		viewAll: "View all",
		searchPeople: "Search people…",
		addPersonBtn: "Add person",
		noPeople: "No people found.",
		settled: "Settled",
		noBalance: "—",
		receivable: "Receivable",
		debt: "Debt",
		back: "← Back",
		recRemaining: "Receivables remaining",
		debtRemaining: "Debts remaining",
		net: "Net",
		addRec: "+ Receivable",
		addDebt: "+ Debt",
		recordPayment: "Record payment",
		settleAccount: "Settle account",
		deletePersonBtn: "Delete person",
		history: "Transaction history",
		noTx: "No transactions yet.",
		remainingLabel: "Remaining:",
		addPersonTitle: "Add person",
		editPersonTitle: "Edit person",
		fName: "Name *",
		phName: "Full name",
		fPhone: "Phone",
		phPhone: "e.g. +1 555 0100",
		fEmail: "Email",
		phEmail: "name@example.com",
		fTags: "Tags",
		phTags: "family, work, friend",
		fTagsHint: "Separate with commas.",
		fNote: "Note",
		phNote: "Full note about this person…",
		personInfoTitle: "Contact info",
		noExtraInfo: "No extra info recorded.",
		nameRequired: "Name is required.",
		personSaved: "Person saved",
		save: "Save",
		cancel: "Cancel",
		addTxTitle: "Add transaction",
		editTxTitle: "Edit transaction",
		fType: "Type",
		typeReceivable: "Receivable",
		typeDebt: "Debt",
		typePaymentReceived: "Payment received",
		typePaymentMade: "Payment made",
		fPerson: "Person *",
		phPerson: "Type a name — new names create a person automatically",
		personRequired: "Person name is required.",
		fAmount: "Amount *",
		phAmount: "e.g. 5,000,000",
		amountInvalid: "Enter a valid positive amount.",
		fDate: "Date",
		fDue: "Due date (optional)",
		fCategory: "Category",
		noCategory: "— no category —",
		fDesc: "Description",
		phDesc: "Reason / description",
		txAdded: "Transaction added",
		txUpdated: "Transaction updated",
		pickDate: "Pick a date…",
		todayBtn: "Today",
		clearBtn: "Clear",
		statusOpen: "Open",
		statusPartial: "Partial — {amt} remaining",
		dPerson: "Person",
		dAmount: "Amount",
		dDate: "Date",
		dStatus: "Status",
		dDue: "Due date",
		dCategory: "Category",
		dDesc: "Description",
		dLinked: "Linked to",
		edit: "Edit",
		delete: "Delete",
		settleRemaining: "Settle remaining",
		settleTxTitle: "Settle transaction",
		settleRecLine: "Record a payment received of {amt} from {name}?",
		settleDebtLine: "Record a payment made of {amt} to {name}?",
		settleNote: "The settlement is recorded as a new payment transaction; the original record stays intact.",
		settle: "Settle",
		deleteTxTitle: "Delete transaction?",
		deleteTxNote: "This cannot be undone.",
		txDeleted: "Transaction deleted",
		confirm: "Confirm",
		deletePersonTitle: "Delete person?",
		deletePersonLine: 'Delete "{name}" and all of their transactions?',
		settleFor: "Settlement for {id}",
		accountSettlement: "Account settlement",
		dueOverdue1: "Overdue (1 day)",
		dueOverdueN: "Overdue ({n} days)",
		dueToday: "Due today",
		dueTomorrow: "Due tomorrow",
		dueInN: "Due in {n} days",
		filterAll: "All",
		filterRec: "Receivables",
		filterDebt: "Debts",
		filterSettled: "Settled",
		filterUnsettled: "Unsettled",
		filterOverdue: "Overdue",
		filterDueSoon: "Due soon",
		filterCategory: "All categories",
		sortNewest: "Newest",
		sortOldest: "Oldest",
		sortHighest: "Highest amount",
		sortLowest: "Lowest amount",
		sortDue: "Nearest due date",
		searchTx: "Search: name, description, amount… (e.g. type:receivable category:Loan)",
		noTxMatch: "No transactions match.",
		dataProblem: "Data file problem",
		unknownError: "Unknown error.",
		retry: "Retry",
		setStorage: "Storage",
		setCentralFile: "Main note file",
		setCentralFileDesc: "The Markdown file where data is stored. Do not delete this file.",
		openFile: "Open file",
		setCurrency: "Currency",
		setCurrencyDesc: "Amounts are stored as plain numbers; the currency is a display unit.",
		setLang: "Language / digits",
		setCalendar: "Calendar",
		setCalendarDesc: 'If the "Persian Calendar" plugin is installed, it is used automatically for holidays and events.',
		calJalali: "Jalali (Solar Hijri)",
		calGregorian: "Gregorian",
		setDateFormat: "Gregorian date format",
		setDateFormatDesc: "Tokens: YYYY, MMM, MM, DD",
		setCompact: "Compact view",
		setDueSoon: '"Due soon" window (days)',
		setConfirmDel: "Confirm before deletion",
		setOpenAfterAdd: "Open dashboard after quick add",
		setCategories: "Transaction categories",
		setCategoriesDesc: "One category per line. These appear in the transaction form.",
		setBackup: "Backup & Export",
		setExportJSON: "Export JSON",
		setExportJSONDesc: "Download the data as a JSON file (for backup).",
		setExportCSV: "Export CSV (Excel)",
		setExportCSVDesc: "Excel-friendly CSV export with Persian support.",
		setImportJSON: "Import JSON",
		setImportJSONDesc: "Load a JSON backup file (replaces current data).",
		exportBtn: "Download",
		importBtn: "Choose file",
		exportDone: "File downloaded",
		importDone: "Data imported",
		importError: "Error reading file",
		cmdOpen: "Open dashboard",
		cmdAddTx: "Add transaction",
		cmdAddPerson: "Add person",
		cmdSearch: "Search transactions",
		ribDashboard: "Personal Accounts — dashboard",
		ribQuickAdd: "Personal Accounts — quick add",
		openNote: "Main file",
		ledgerPeopleH: "People & balances",
		ledgerTxH: "Transactions",
		ledgerPeopleDetailsH: "People",
		thPerson: "Person",
		thRec: "Receivable",
		thDebt: "Debt",
		thNet: "Net",
		thId: "ID",
		thDate: "Date",
		thType: "Type",
		thAmount: "Amount",
		thDesc: "Description",
		anaCharts: "Charts",
		anaReport: "Monthly report",
		anaCashflow: "Cash flow",
		chartTrend: "Receivables vs debts (cumulative)",
		chartPie: "Distribution by category",
		chartBar: "Balance by person",
		repGot: "Received",
		repPaid: "Paid",
		repCount: "Transactions",
		repTxList: "Transactions this month",
		repMonth: "Month",
		cfWeek: "Next week",
		cfMonth: "Next month",
		cfQuarter: "Next quarter",
		cfDetail: "Detail for next 30 days",
		savedViews: "Saved view",
		saveView: "Save view",
		viewName: "View name:",
		viewSaved: "View saved",
		recurringDue: 'Recurring template "{name}" is due today',
		reminderTitle: "⏰ Accounts reminder",
		fileMissingWarn: "⚠️ Personal Accounts file not found! If you deleted it, your data is gone.",
		tipDashboard: "Overview of balances, due items, and people",
		tipPeople: "All people with contact info and account balances",
		tipTransactions: "All transactions with filters, search, and sorting",
		tipAnalytics: "Charts, monthly report, and cash flow",
		tipAddTx: "Quickly record a new receivable, debt, or payment",
		tipReload: "Reload data from the MD file",
		tipOpenNote: "Open the MD file in the editor",
		tipSearchPeople: "Search by name, phone, email, tag, or note",
		tipAddPerson: "Add a new person with contact info",
		tipEditPerson: "Edit this person’s info",
		tipDeletePerson: "Delete this person and all their transactions",
		tipOpenPerson: "View full profile and transactions",
		tipSettle: "Settle the full remaining balance as a new transaction",
		tipRecordPayment: "Record a partial payment or receipt",
		tipAddRec: "Record a new receivable from this person",
		tipAddDebt: "Record a new debt to this person",
		tipTxRow: "Click for details, edit, or delete",
		tipStatRec: "Total money others owe you",
		tipStatDebt: "Total money you owe others",
		tipStatNet: "Receivables minus debts",
		tipStatPeople: "Number of people with transactions",
		tipStatUnsettled: "People who still have a balance",
		tipStatSettled: "People fully settled",
		tipStatOverdue: "Transactions past their due date",
		tipStatDueSoon: "Transactions approaching their due date",
		tipFilter: "Filter transactions by status",
		tipCategoryFilter: "Filter by category",
		tipSort: "Change sort order",
		tipSaveView: "Save current filters and search as a view",
		tipChartTrend: "Cumulative comparison of receivables and debts over time",
		tipChartPie: "Share of each category in total amounts",
		tipChartBar: "Top 10 people by net balance",
		tipDueChip: "Due status of this transaction",
		tipSettleRemaining: "Record a payment for the exact remaining amount",
		tipDatePicker: "Pick a date from the calendar",
		tipAmount: "You can use arithmetic (e.g. 1000+500)",
		tipAddButton: "Add a new transaction",
		anaOverview: "Overview",
		anaTrends: "Trends",
		anaBreakdown: "Breakdown",
		chartKpiRec: "Collection rate",
		chartKpiSettle: "Settlement rate",
		chartKpiAvg: "Avg transaction",
		chartKpiGrowth: "Monthly growth",
		chartTrendCum: "Cumulative receivables & debts",
		chartTrendNet: "Net trend (monthly)",
		chartAge: "Receivables aging",
		chartTopDebtors: "Top debtors",
		chartTopCreditors: "Top creditors",
		chartHeatmap: "Monthly activity heatmap",
		chartRadial: "Category distribution (radar)",
		chartWaterfall: "Cash flow waterfall",
		chartPaymentSpeed: "Payment speed (days)",
		chartCatCompare: "Receivable vs debt by category",
		noData: "No data to display",
		vsLastMonth: "vs last month",
		days: "days",
		count: "count",
		ageFresh: "Fresh (0-30)",
		ageMild: "Mild (31-90)",
		ageOld: "Old (91-180)",
		ageStale: "Stale (180+)",
		helpTitle: "Help",
		close: "Close",
		helpKpiRec: "Collection rate: % of total receivables that has been collected.",
		helpKpiSettle: "Settlement rate: % of transactions that are fully settled.",
		helpKpiAvg: "Average transaction amount.",
		helpKpiGrowth: "Compare this month volume with last month.",
		helpTrendCum: "Running total of receivables and debts over time.",
		helpTrendNet: "Receivables minus debts per month. Green = you are a creditor.",
		helpHeatmap: "Each cell is a day. Darker = more transactions that day.",
		helpAge: "How long money has been outstanding. Fresh is good, stale is warning.",
		helpTopDebtors: "People who owe you the most.",
		helpTopCreditors: "People you owe the most.",
		helpRadar: "Visual comparison of volume across categories.",
		helpWaterfall: "Cumulative receipts minus payments over time.",
		helpPaymentSpeed: "Average days to settle a receivable or debt.",
		helpCatCompare: "How much receivable vs debt in each category.",
		helpBarPerson: "Net balance per person. Green = they owe you.",
		helpPie: "Share of each category in total amounts.",
		helpCashflowPeriods: "Money to receive or pay in the next week/month/quarter.",
		helpCashflowDetail: "All upcoming due dates in the next 30 days.",
		helpMonthly: "Full summary of a specific month."
	}
};
const CURRENT = {
	locale: "en"
};

function t(key, vars) {
	const dict = STRINGS[CURRENT.locale] || STRINGS.en;
	let s = dict[key] != null ? dict[key] : STRINGS.en[key] != null ? STRINGS.en[key] : key;
	if (vars)
		for (const k in vars) s = s.split("{" + k + "}").join(String(vars[k]));
	return s
}

function typeLabel(type) {
	const map = {
		receivable: "typeReceivable",
		debt: "typeDebt",
		payment_received: "typePaymentReceived",
		payment_made: "typePaymentMade"
	};
	return t(map[type] || type)
}

function el(tag, cls, text) {
	const e = document.createElement(tag);
	if (cls) e.className = cls;
	if (text !== undefined) e.textContent = text;
	return e
}

function pad2(n) {
	return n < 10 ? "0" + n : String(n)
}

function toISO(d) {
	return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate())
}

function todayISO() {
	return toISO(new Date)
}

function parseISO(iso) {
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
	if (!m) return null;
	const v = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
	return Number.isNaN(v) ? null : v
}

function diffDays(fromISOStr, toISOStr) {
	const a = parseISO(fromISOStr),
		b = parseISO(toISOStr);
	if (a === null || b === null) return 0;
	return Math.round((b - a) / 864e5)
}

function isoWeekday(iso) {
	const ms = parseISO(iso);
	return ms === null ? null : new Date(ms).getUTCDay()
}
const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function normalizeDigits(s) {
	return String(s).replace(/[۰-۹٠-٩]/g, ch => {
		const i = FA_DIGITS.indexOf(ch);
		return String(i >= 0 ? i : AR_DIGITS.indexOf(ch))
	})
}

function localizeDigits(s, fa) {
	if (!fa) return String(s);
	return Cal.toFa(s)
}

function parseAmount(input) {
	const cleaned = normalizeDigits(input).replace(/[,٬\s]/g, "").replace(/[٫]/g, ".");
	if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
	const n = Number(cleaned);
	return Number.isFinite(n) ? n : null
}

function evalAmountExpr(expr) {
	const cleaned = normalizeDigits(expr).replace(/[,٬\s]/g, "").replace(/[٫]/g, ".");
	if (!cleaned) return null;
	if (!/^[\d+\-*/().]+$/.test(cleaned)) return null;
	try {
		const result = Function('"use strict"; return (' + cleaned + ")")();
		return Number.isFinite(result) && result > 0 ? result : null
	} catch (e) {
		return null
	}
}

function attachAmountInput(input, isFa) {
	const format = () => {
		const raw = input.value;
		if (!raw) return;
		const caret = input.selectionStart == null ? raw.length : input.selectionStart;
		const norm = normalizeDigits(raw);
		const digitsBefore = norm.slice(0, caret).replace(/[^0-9]/g, "").length;
		let cleaned = norm.replace(/[^0-9.]/g, "");
		const segs = cleaned.split(".");
		if (segs.length > 2) cleaned = segs[0] + "." + segs.slice(1).join("");
		if (cleaned === "" || cleaned === ".") {
			input.value = cleaned;
			return
		}
		const parts = cleaned.split(".");
		const ip = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		let out = localizeDigits(ip, isFa());
		if (parts.length > 1) out += (isFa() ? "٫" : ".") + localizeDigits(parts[1], isFa());
		input.value = out;
		let count = 0,
			i = 0;
		while (i < out.length && count < digitsBefore) {
			if (/[0-9]/.test(normalizeDigits(out.charAt(i)))) count++;
			i++
		}
		try {
			input.setSelectionRange(i, i)
		} catch (e) {}
	};
	input.addEventListener("input", format);
	return {
		refresh: format
	}
}

function randomId(prefix) {
	return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/* ✅ FIX #2: پایدارسازی createdAt بر اساس محتوا (برای پارسر) */
function stableTime(str) {
	let h = 0;
	const s = String(str || "");
	for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
	return Math.abs(h) || 1
}

function jDiv(a, b) {
	return ~~(a / b)
}

function jMod(a, b) {
	return a - ~~(a / b) * b
}
const J_BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];

function jalCal(jy) {
	const bl = J_BREAKS.length;
	const gy = jy + 621;
	let leapJ = -14,
		jp = J_BREAKS[0],
		jm, jump = 0,
		n, i;
	if (jy < jp || jy >= J_BREAKS[bl - 1]) throw new Error("Invalid Jalali year " + jy);
	for (i = 1; i < bl; i++) {
		jm = J_BREAKS[i];
		jump = jm - jp;
		if (jy < jm) break;
		leapJ = leapJ + jDiv(jump, 33) * 8 + jDiv(jMod(jump, 33), 4);
		jp = jm
	}
	n = jy - jp;
	leapJ = leapJ + jDiv(n, 33) * 8 + jDiv(jMod(n, 33) + 3, 4);
	if (jMod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
	const leapG = jDiv(gy, 4) - jDiv((jDiv(gy, 100) + 1) * 3, 4) - 150;
	const march = 20 + leapJ - leapG;
	if (jump - n < 6) n = n - jump + jDiv(jump + 4, 33) * 33;
	let leap = jMod(jMod(n + 1, 33) - 1, 4);
	if (leap === -1) leap = 4;
	return {
		leap,
		gy,
		march
	}
}

function g2d(gy, gm, gd) {
	let d = jDiv((gy + jDiv(gm - 8, 6) + 100100) * 1461, 4) + jDiv(153 * jMod(gm + 9, 12) + 2, 5) + gd - 34840408;
	d = d - jDiv(jDiv(gy + 100100 + jDiv(gm - 8, 6), 100) * 3, 4) + 752;
	return d
}

function d2g(jdn) {
	let j = 4 * jdn + 139361631;
	j = j + jDiv(jDiv(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
	const i = jDiv(jMod(j, 1461), 4) * 5 + 308;
	const gd = jDiv(jMod(i, 153), 5) + 1;
	const gm = jMod(jDiv(i, 153), 12) + 1;
	const gy = jDiv(j, 1461) - 100100 + jDiv(8 - gm, 6);
	return {
		gy,
		gm,
		gd
	}
}

function j2d(jy, jm, jd) {
	const r = jalCal(jy);
	return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - jDiv(jm, 7) * (jm - 7) + jd - 1
}

function d2j(jdn) {
	const gy = d2g(jdn).gy;
	let jy = gy - 621;
	const r = jalCal(jy);
	const jdn1f = g2d(gy, 3, r.march);
	let k = jdn - jdn1f,
		jm, jd;
	if (k >= 0) {
		if (k <= 185) {
			jm = 1 + jDiv(k, 31);
			jd = jMod(k, 31) + 1;
			return {
				jy,
				jm,
				jd
			}
		}
		k -= 186
	} else {
		jy -= 1;
		k += 179;
		if (r.leap === 1) k += 1
	}
	jm = 7 + jDiv(k, 30);
	jd = jMod(k, 30) + 1;
	return {
		jy,
		jm,
		jd
	}
}

function toJalaali(gy, gm, gd) {
	return d2j(g2d(gy, gm, gd))
}

function toGregorian(jy, jm, jd) {
	return d2g(j2d(jy, jm, jd))
}

function isLeapJalaaliYear(jy) {
	return jalCal(jy).leap === 0
}

function jalaaliMonthLength(jy, jm) {
	if (jm <= 6) return 31;
	if (jm <= 11) return 30;
	return isLeapJalaaliYear(jy) ? 30 : 29
}
const JALALI_MONTHS_FA = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const JALALI_MONTHS_EN = ["Farvardin", "Ordibehesht", "Khordad", "Tir", "Mordad", "Shahrivar", "Mehr", "Aban", "Azar", "Dey", "Bahman", "Esfand"];
const GREG_MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const GREG_MONTHS_FA = ["ژانویه", "فوریه", "مارس", "آوریل", "مه", "ژوئن", "ژوئیه", "اوت", "سپتامبر", "اکتبر", "نوامبر", "دسامبر"];
const WEEKDAY_FA = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];
const WEEKDAY_FA_SHORT = ["ی", "د", "س", "چ", "پ", "ج", "ش"];
const WEEKDAY_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAY_EN_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function gregParts(iso) {
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
	return m ? {
		y: +m[1],
		m: +m[2],
		d: +m[3]
	} : null
}

function gregMonthName(m, lang) {
	const l = lang || CURRENT.locale;
	return (l === "fa" ? GREG_MONTHS_FA : GREG_MONTHS_EN)[m - 1] || String(m)
}

function calDateFromISO(iso, calendar) {
	if (calendar === "jalali") {
		const j = Cal.isoToJ(iso);
		if (!j) return null;
		const g = Cal.jToG(j.jy, j.jm, j.jd);
		return Cal.dateAtNoon(g.gy, g.gm, g.gd)
	}
	const p = gregParts(iso);
	return p ? Cal.dateAtNoon(p.y, p.m, p.d) : null
}
const Cal = {
	api: null,
	appRef: null,
	refresh(app) {
		this.api = null;
		try {
			let plug = null;
			try {
				plug = app.plugins.getPlugin("persian-calendar")
			} catch (e) {}
			if (!plug && app.plugins && app.plugins.plugins) plug = app.plugins.plugins["persian-calendar"];
			const cand = plug && typeof plug === "object" ? plug.api || plug : null;
			if (cand && typeof cand.jalaliToGregorian === "function" && typeof cand.gregorianToJalali === "function") {
				this.api = cand
			}
		} catch (e) {
			this.api = null
		}
		return !!this.api
	},
	ensure(app) {
		if (this.api) return true;
		const a = app || this.appRef;
		return a ? this.refresh(a) : false
	},
	hasApi() {
		return !!this.api
	},
	toFa(s) {
		if (this.api && typeof this.api.toFaNumber === "function") {
			try {
				return this.api.toFaNumber(String(s))
			} catch (e) {}
		}
		return String(s).replace(/\d/g, d => FA_DIGITS[Number(d)])
	},
	jToG(jy, jm, jd) {
		if (this.api) {
			try {
				const g = this.api.jalaliToGregorian(jy, jm, jd);
				if (g && [g.gy, g.gm, g.gd].every(v => Number.isFinite(v))) {
					return {
						gy: g.gy,
						gm: g.gm,
						gd: g.gd
					}
				}
			} catch (e) {}
		}
		return toGregorian(jy, jm, jd)
	},
	gToJ(gy, gm, gd) {
		if (this.api) {
			try {
				const j = this.api.gregorianToJalali(gy, gm, gd);
				if (j && [j.jy, j.jm, j.jd].every(v => Number.isFinite(v))) {
					return {
						jy: j.jy,
						jm: j.jm,
						jd: j.jd
					}
				}
			} catch (e) {}
		}
		return toJalaali(gy, gm, gd)
	},
	isoToJ(iso) {
		const ms = parseISO(iso);
		if (ms === null) return null;
		const d = new Date(ms);
		try {
			return this.gToJ(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate())
		} catch (e) {
			return null
		}
	},
	jToISO(jy, jm, jd) {
		const g = this.jToG(jy, jm, jd);
		return g.gy + "-" + pad2(g.gm) + "-" + pad2(g.gd)
	},
	monthLen(jy, jm) {
		const ny = jm === 12 ? jy + 1 : jy;
		const nm = jm === 12 ? 1 : jm + 1;
		try {
			const a = this.jToG(jy, jm, 1);
			const b = this.jToG(ny, nm, 1);
			const len = Math.round((Date.UTC(b.gy, b.gm - 1, b.gd) - Date.UTC(a.gy, a.gm - 1, a.gd)) / 864e5);
			if (len >= 29 && len <= 31) return len
		} catch (e) {}
		return jalaaliMonthLength(jy, jm)
	},
	monthName(jm, lang) {
		const l = lang || CURRENT.locale;
		if (this.api && typeof this.api.jalaliMonthName === "function") {
			try {
				const s = this.api.jalaliMonthName(jm, l === "en" ? "en" : undefined);
				if (typeof s === "string" && s) return s
			} catch (e) {}
		}
		return (l === "en" ? JALALI_MONTHS_EN : JALALI_MONTHS_FA)[jm - 1] || String(jm)
	},
	weekdayName(jsDay, lang, short) {
		const l = lang || CURRENT.locale;
		const idx = (jsDay % 7 + 7) % 7;
		if (l === "en") return (short ? WEEKDAY_EN_SHORT : WEEKDAY_EN)[idx];
		return (short ? WEEKDAY_FA_SHORT : WEEKDAY_FA)[idx]
	},
	dateAtNoon(gy, gm, gd) {
		return new Date(Date.UTC(gy, gm - 1, gd, 12))
	},
	isHoliday(dateObj) {
		if (!this.api || typeof this.api.checkHoliday !== "function") return false;
		try {
			return this.api.checkHoliday(dateObj) === true
		} catch (e) {
			return false
		}
	},
	eventsOf(dateObj) {
		if (!this.api || typeof this.api.dateToEvents !== "function") return [];
		try {
			const evs = this.api.dateToEvents(dateObj);
			if (!Array.isArray(evs)) return [];
			return evs.map(ev => {
				if (!ev) return "";
				const ti = ev.title;
				if (typeof ti === "string") return ti;
				if (ti && typeof ti === "object") {
					return (CURRENT.locale === "fa" ? ti.fa || ti.en : ti.en || ti.fa) || ""
				}
				return ""
			}).filter(Boolean)
		} catch (e) {
			return []
		}
	}
};
class Fmt {
	constructor(getSettings) {
		this.get = getSettings
	}
	get s() {
		return this.get()
	}
	get fa() {
		return this.s.locale === "fa"
	}
	num(n) {
		try {
			return n.toLocaleString(this.fa ? "fa-IR" : "en-US", {
				maximumFractionDigits: 2
			})
		} catch (e) {
			return localizeDigits(n.toLocaleString("en-US"), this.fa)
		}
	}
	currencyLabel() {
		const c = CURRENCIES.find(x => x.code === this.s.currency);
		if (!c) return this.s.currency;
		return this.fa ? c.labelFa : c.label
	}
	currencySymbol() {
		const c = CURRENCIES.find(x => x.code === this.s.currency);
		return c && c.symbol ? c.symbol : ""
	}
	amount(n, withCurrency) {
		if (withCurrency === undefined) withCurrency = true;
		const body = this.num(Math.abs(n));
		const sign = n < 0 ? "−" : "";
		return sign + body + (withCurrency ? " " + this.currencyLabel() : "")
	}
	date(iso) {
		if (!iso) return "—";
		if (this.s.calendar === "jalali") {
			const j = Cal.isoToJ(iso);
			if (j) {
				return localizeDigits(String(j.jd), this.fa) + " " + Cal.monthName(j.jm) + " " + localizeDigits(String(j.jy), this.fa)
			}
			return iso
		}
		const ms = parseISO(iso);
		if (ms === null) return iso;
		const d = new Date(ms);
		const fmt = this.s.dateFormat || "YYYY-MM-DD";
		const out = fmt.replace("YYYY", String(d.getUTCFullYear())).replace("MMM", d.toLocaleDateString("en-US", {
			month: "short",
			timeZone: "UTC"
		})).replace("MM", pad2(d.getUTCMonth() + 1)).replace("DD", pad2(d.getUTCDate()));
		return localizeDigits(out, this.fa)
	}
	dateForNote(iso) {
		return this.date(iso)
	}
}
const isOrigin = tx => tx.type === "receivable" || tx.type === "debt";
const chronological = (a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt;

function computeBalances(data) {
	const map = new Map;
	for (const p of data.people) {
		map.set(p.id, {
			person: p,
			totalReceivable: 0,
			totalDebt: 0,
			totalReceived: 0,
			totalPaid: 0,
			remainingReceivable: 0,
			remainingDebt: 0,
			net: 0,
			txCount: 0,
			lastActivity: 0
		})
	}
	for (const tx of data.transactions) {
		const b = map.get(tx.personId);
		if (!b) continue;
		b.txCount += 1;
		b.lastActivity = Math.max(b.lastActivity, tx.createdAt);
		switch (tx.type) {
			case "receivable":
				b.totalReceivable += tx.amount;
				break;
			case "debt":
				b.totalDebt += tx.amount;
				break;
			case "payment_received":
				b.totalReceived += tx.amount;
				break;
			case "payment_made":
				b.totalPaid += tx.amount;
				break
		}
	}
	for (const b of map.values()) {
		b.remainingReceivable = b.totalReceivable - b.totalReceived;
		b.remainingDebt = b.totalDebt - b.totalPaid;
		b.net = b.remainingReceivable - b.remainingDebt
	}
	return map
}

function allocate(originList, paymentList) {
	const origins = [...originList].sort(chronological);
	const payments = [...paymentList].sort(chronological);
	const open = new Map(origins.map(o => [o.id, o.amount]));
	const allocated = new Map;
	const give = (id, v) => allocated.set(id, (allocated.get(id) || 0) + v);
	const queue = [];
	for (const p of payments) {
		let rest = p.amount;
		if (p.linkedTo && open.has(p.linkedTo)) {
			const take = Math.min(open.get(p.linkedTo), rest);
			if (take > 0) {
				open.set(p.linkedTo, open.get(p.linkedTo) - take);
				give(p.linkedTo, take);
				rest -= take
			}
		}
		if (rest > EPS) queue.push(rest)
	}
	let qi = 0;
	for (const o of origins) {
		let need = open.get(o.id);
		while (need > EPS && qi < queue.length) {
			const take = Math.min(queue[qi], need);
			queue[qi] -= take;
			need -= take;
			give(o.id, take);
			if (queue[qi] <= EPS) qi += 1
		}
		open.set(o.id, need)
	}
	return allocated
}

function dueInfoFor(dueDate, today, soonDays) {
	if (!dueDate) return null;
	const days = diffDays(today, dueDate);
	const nStr = n => localizeDigits(String(n), CURRENT.locale === "fa");
	if (days < 0) return {
		kind: "overdue",
		days,
		label: days === -1 ? t("dueOverdue1") : t("dueOverdueN", {
			n: nStr(-days)
		})
	};
	if (days === 0) return {
		kind: "today",
		days,
		label: t("dueToday")
	};
	if (days === 1) return {
		kind: "soon",
		days,
		label: t("dueTomorrow")
	};
	if (days <= soonDays) return {
		kind: "soon",
		days,
		label: t("dueInN", {
			n: nStr(days)
		})
	};
	return {
		kind: "future",
		days,
		label: ""
	}
}

function computeTxStates(data, today, soonDays) {
	const states = new Map;
	const groups = new Map;
	const groupOf = key => {
		let g = groups.get(key);
		if (!g) {
			g = {
				origins: [],
				payments: []
			};
			groups.set(key, g)
		}
		return g
	};
	for (const tx of data.transactions)
		if (isOrigin(tx)) groupOf(tx.personId + "|" + tx.type).origins.push(tx);
	for (const tx of data.transactions) {
		if (tx.type === "payment_received") groupOf(tx.personId + "|receivable").payments.push(tx);
		else if (tx.type === "payment_made") groupOf(tx.personId + "|debt").payments.push(tx)
	}
	for (const g of groups.values()) {
		const alloc = allocate(g.origins, g.payments);
		for (const o of g.origins) {
			const allocAmt = alloc.get(o.id) || 0;
			const remaining = Math.round((o.amount - allocAmt) * 100) / 100;
			const status = remaining <= EPS ? "settled" : allocAmt > EPS ? "partial" : "open";
			const due = status === "settled" ? null : dueInfoFor(o.dueDate, today, soonDays);
			states.set(o.id, {
				allocated: allocAmt,
				remaining,
				status,
				due
			})
		}
	}
	return states
}

function computeLedger(data, today, dueSoonDays) {
	const balances = computeBalances(data);
	const states = computeTxStates(data, today, dueSoonDays);
	const stats = {
		totalReceivables: 0,
		totalDebts: 0,
		net: 0,
		peopleCount: 0,
		unpaidCount: 0,
		settledCount: 0,
		overdueCount: 0,
		dueSoonCount: 0
	};
	for (const b of balances.values()) {
		if (b.txCount > 0) stats.peopleCount += 1;
		stats.totalReceivables += b.remainingReceivable;
		stats.totalDebts += b.remainingDebt;
		if (b.remainingReceivable > EPS || b.remainingDebt > EPS) stats.unpaidCount += 1;
		else if (b.txCount > 0) stats.settledCount += 1
	}
	stats.net = stats.totalReceivables - stats.totalDebts;
	const names = new Map(data.people.map(p => [p.id, p.name]));
	const attention = [];
	for (const tx of data.transactions) {
		const st = states.get(tx.id);
		if (!st || !st.due) continue;
		const k = st.due.kind;
		if (k === "overdue") stats.overdueCount += 1;
		else if (k === "today" || k === "soon") stats.dueSoonCount += 1;
		if (k !== "future") attention.push({
			tx,
			personName: names.get(tx.personId) || "?",
			due: st.due,
			remaining: st.remaining
		})
	}
	attention.sort((a, b) => a.due.days - b.due.days || a.tx.date.localeCompare(b.tx.date));
	return {
		balances,
		states,
		stats,
		attention
	}
}
function emptyData() {
	return {
		version: DATA_VERSION,
		people: [],
		transactions: []
	}
}

function optString(v) {
	const s = typeof v === "string" ? v.trim() : "";
	return s || undefined
}

function toNum(v, fallback) {
	const n = typeof v === "number" ? v : Number(v);
	return Number.isFinite(n) ? n : fallback
}

function sanitizeData(raw) {
	const src = raw && typeof raw === "object" ? raw : {};
	const data = emptyData();
	const seen = new Set;
	for (const p of Array.isArray(src.people) ? src.people : []) {
		if (!p || typeof p !== "object") continue;
		const id = optString(p.id) || randomId("p");
		if (seen.has(id)) continue;
		seen.add(id);
		data.people.push({
			id,
			name: optString(p.name) || "?",
			phone: optString(p.phone),
			email: optString(p.email),
			tags: Array.isArray(p.tags) ? p.tags.map(x => String(x).trim()).filter(Boolean) : typeof p.tags === "string" ? p.tags.split(/[,،\n]+/).map(x => x.trim()).filter(Boolean) : [],
			note: optString(p.note),
			createdAt: toNum(p.createdAt, Date.now()),
			updatedAt: toNum(p.updatedAt, Date.now())
		})
	}
	for (const tx of Array.isArray(src.transactions) ? src.transactions : []) {
		if (!tx || typeof tx !== "object") continue;
		const type = VALID_TYPES.includes(tx.type) ? tx.type : null;
		const amount = toNum(tx.amount, NaN);
		if (!type || !Number.isFinite(amount) || amount < 0) continue;
		const origin = type === "receivable" || type === "debt";
		data.transactions.push({
			id: optString(tx.id) || randomId("t"),
			personId: optString(tx.personId) || "",
			type,
			amount: Math.abs(amount),
			date: ISO_RE.test(tx.date || "") ? tx.date : todayISO(),
			description: optString(tx.description),
			category: optString(tx.category),
			dueDate: origin && ISO_RE.test(tx.dueDate || "") ? tx.dueDate : undefined,
			linkedTo: origin ? undefined : optString(tx.linkedTo),
			createdAt: toNum(tx.createdAt, Date.now()),
			updatedAt: toNum(tx.updatedAt, Date.now())
		})
	}
	return data
}

function cleanNumber(s) {
	const n = normalizeDigits(String(s || "")).replace(/[,٬\s]/g, "").replace(/٫/g, ".");
	const v = Number(n);
	return Number.isFinite(v) ? v : 0
}

function parseTable(lines, startIdx) {
	let i = startIdx;
	while (i < lines.length && !lines[i].trim().startsWith("|")) i++;
	if (i >= lines.length) return {
		rows: [],
		endIdx: startIdx
	};
	const headers = lines[i].trim().split("|").slice(1, -1).map(h => h.trim());
	i++;
	if (i < lines.length && /^\|[\s\-:|]+\|$/.test(lines[i].trim())) i++;
	const rows = [];
	while (i < lines.length && lines[i].trim().startsWith("|")) {
		const cells = lines[i].trim().split("|").slice(1, -1).map(c => c.replace(/\\\|/g, "|").trim());
		const obj = {};
		headers.forEach((h, idx) => {
			obj[h] = cells[idx] || ""
		});
		rows.push(obj);
		i++
	}
	return {
		rows,
		endIdx: i
	}
}

function labelToType(label) {
	const s = String(label || "").trim().toLowerCase();
	const map = {
		"طلب": "receivable",
		receivable: "receivable",
		"بدهی": "debt",
		debt: "debt",
		"دریافت": "payment_received",
		"دریافت شد": "payment_received",
		"payment received": "payment_received",
		payment_received: "payment_received",
		"پرداخت": "payment_made",
		"پرداخت شد": "payment_made",
		"payment made": "payment_made",
		payment_made: "payment_made"
	};
	return map[s] || null
}

function parseDateString(s, calendar) {
	if (!s || s === "—") return null;
	const cleaned = normalizeDigits(String(s).trim());
	const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(cleaned);
	if (m) {
		if (calendar === "jalali") return Cal.jToISO(Number(m[1]), Number(m[2]), Number(m[3]));
		return m[1] + "-" + pad2(Number(m[2])) + "-" + pad2(Number(m[3]))
	}
	const m2 = /^(\d{4})[\/](\d{1,2})[\/](\d{1,2})$/.exec(cleaned);
	if (m2) {
		if (calendar === "jalali") return Cal.jToISO(Number(m2[1]), Number(m2[2]), Number(m2[3]));
		return m2[1] + "-" + pad2(Number(m2[2])) + "-" + pad2(Number(m2[3]))
	}
	return null
}

function parsePeopleDetails(lines, startIdx, endIdx) {
	const people = [];
	const byName = new Map;
	let i = startIdx + 1;
	while (i < endIdx && !lines[i].trim().startsWith("|")) {
		if (/^##\s+/.test(lines[i])) return {
			people,
			byName
		};
		i++
	}
	if (i >= endIdx) return {
		people,
		byName
	};
	const headerCells = lines[i].trim().split("|").slice(1, -1).map(h => h.trim());
	i++;
	if (i < endIdx && /^\|[\s\-:|]+\|$/.test(lines[i].trim())) i++;
	const idxOf = candidates => {
		for (let k = 0; k < headerCells.length; k++) {
			const h = headerCells[k].trim().toLowerCase();
			for (const c of candidates) {
				if (h === c.toLowerCase()) return k
			}
		}
		return -1
	};
	const iName = idxOf(["نام", "name", "نام *", "name *"]);
	const iPhone = idxOf(["تلفن", "phone"]);
	const iEmail = idxOf(["ایمیل", "email"]);
	const iTags = idxOf(["برچسب‌ها", "tags", "برچسبها"]);
	const iNote = idxOf(["یادداشت", "note"]);
	if (iName < 0) {
		return parsePeopleDetailsLegacy(lines, startIdx, endIdx)
	}
	while (i < endIdx && lines[i].trim().startsWith("|")) {
		const raw = lines[i].trim();
		if (/^\|[\s\-:|]+\|$/.test(raw)) {
			i++;
			continue
		}
		const cells = raw.split("|").slice(1, -1).map(c => c.trim());
		const get = idx => idx >= 0 ? (cells[idx] || "").replace(/\\\|/g, "|").trim() : "";
		const name = get(iName);
		if (name) {
			const tagsRaw = get(iTags);
			const tags = [...tagsRaw.matchAll(/`([^`]+)`/g)].map(m => m[1].trim()).filter(Boolean);
			const noteRaw = get(iNote).replace(/<br\s*\/?>/gi, "\n");
			/* ✅ FIX #2: استفاده از stableTime به‌جای Date.now() برای پایداری بین reloadها */
			const st = stableTime(name);
			const person = {
				id: randomId("p"),
				name,
				phone: get(iPhone) || undefined,
				email: get(iEmail) || undefined,
				tags,
				note: noteRaw || undefined,
				createdAt: st,
				updatedAt: st
			};
			people.push(person);
			byName.set(name, person)
		}
		i++
	}
	return {
		people,
		byName
	}
}

function parsePeopleDetailsLegacy(lines, startIdx, endIdx) {
	const people = [];
	const byName = new Map;
	let i = startIdx + 1;
	let current = null;
	while (i < endIdx) {
		const line = lines[i];
		const h = /^###\s+(.+?)\s*$/.exec(line);
		if (h) {
			const name = h[1].trim();
			if (name) {
				const st = stableTime(name);
				current = {
					id: randomId("p"),
					name,
					phone: undefined,
					email: undefined,
					tags: [],
					note: undefined,
					createdAt: st,
					updatedAt: st
				};
				people.push(current);
				byName.set(name, current)
			}
			i++;
			continue
		}
		if (current) {
			const phoneRe = /^\*\*(?:تلفن|Phone):\*\*\s*(.*)$/i;
			const emailRe = /^\*\*(?:ایمیل|Email):\*\*\s*(.*)$/i;
			const tagsRe = /^\*\*(?:برچسب‌ها|Tags):\*\*\s*(.*)$/i;
			const noteRe = /^\*\*(?:یادداشت|Note):\*\*\s*$/i;
			const mPhone = phoneRe.exec(line);
			if (mPhone) {
				current.phone = mPhone[1].trim() || undefined;
				i++;
				continue
			}
			const mEmail = emailRe.exec(line);
			if (mEmail) {
				current.email = mEmail[1].trim() || undefined;
				i++;
				continue
			}
			const mTags = tagsRe.exec(line);
			if (mTags) {
				current.tags = [...mTags[1].matchAll(/`([^`]+)`/g)].map(m => m[1].trim()).filter(Boolean);
				i++;
				continue
			}
			if (noteRe.test(line)) {
				const buf = [];
				i++;
				while (i < endIdx && /^>\s?/.test(lines[i])) {
					buf.push(lines[i].replace(/^>\s?/, ""));
					i++
				}
				current.note = buf.join("\n").trim() || undefined;
				continue
			}
		}
		i++
	}
	return {
		people,
		byName
	}
}

function parseMarkdownData(content, calendar) {
	const data = emptyData();
	const lines = content.split("\n");
	const findHeader = re => lines.findIndex(l => re.test(l));
	const balancesHeader = findHeader(/^##\s+افراد و مانده‌ها|^##\s+People\s*&\s*Balances/i);
	const txHeader = findHeader(/^##\s+تراکنش|^##\s+Transactions/i);
	const peopleHeader = findHeader(/^##\s+افراد\s*$|^##\s+People\s*$/i);
	const personByName = new Map;
	if (peopleHeader >= 0) {
		const endIdx = lines.length;
		const parsed = parsePeopleDetails(lines, peopleHeader, endIdx);
		for (const p of parsed.people) {
			data.people.push(p);
			personByName.set(p.name, p)
		}
	}
	if (txHeader < 0) return sanitizeData(data);
	const {
		rows
	} = parseTable(lines, txHeader + 1);
	for (const row of rows) {
		const dateRaw = row["تاریخ"] || row["Date"];
		const personName = (row["شخص"] || row["Person"] || "").trim();
		const typeRaw = row["نوع"] || row["Type"];
		const amountRaw = row["مبلغ"] || row["Amount"];
		const categoryRaw = (row["دسته"] || row["Category"] || "").trim();
		const descRaw = row["شرح"] || row["Description"] || "";
		const dueRaw = row["سررسید"] || row["Due"] || "";
		if (!personName || !typeRaw || !amountRaw) continue;
		const type = labelToType(typeRaw);
		if (!type) continue;
		const amount = cleanNumber(amountRaw);
		if (!amount || amount <= 0) continue;
		const dateIso = parseDateString(dateRaw, calendar) || todayISO();
		let person = personByName.get(personName);
		if (!person) {
			person = data.people.find(p => p.name === personName);
			if (!person) {
				const st = stableTime(personName);
				person = {
					id: randomId("p"),
					name: personName,
					tags: [],
					createdAt: st,
					updatedAt: st
				};
				data.people.push(person)
			}
			personByName.set(personName, person)
		}
		const origin = type === "receivable" || type === "debt";
		const dueIso = origin ? parseDateString(dueRaw, calendar) : null;
		/* ✅ FIX #2: createdAt پایدار بر اساس اندیس تراکنش (نه Date.now()) */
		const idx = data.transactions.length + 1;
		data.transactions.push({
			id: randomId("t"),
			personId: person.id,
			type,
			amount,
			date: dateIso,
			description: descRaw.trim() || undefined,
			category: categoryRaw || undefined,
			dueDate: dueIso || undefined,
			createdAt: idx,
			updatedAt: idx
		})
	}
	return sanitizeData(data)
}

function renderMarkdownData(data, fmt) {
	const lines = [];
	const fa = CURRENT.locale === "fa";
	const warnTitle = fa ? "⚠️ **این فایل را پاک نکنید!**" : "⚠️ **Do not delete this file!**";
	const warnBody = fa ? "در صورت پاک کردن، تمام اطلاعات حساب‌های شخصی شما حذف خواهد شد." : "If you delete it, all of your personal account data will be lost.";
	const warnFooter = fa ? "این فایل توسط پلاگین «حساب‌های شخصی» مدیریت می‌شود." : 'This file is managed by the "Personal Accounts" plugin.';
	lines.push("> " + warnTitle);
	lines.push("> " + warnBody);
	lines.push("> " + warnFooter);
	lines.push("");
	lines.push("# " + t("appTitle"), "");
	lines.push("## " + t("ledgerPeopleH"), "");
	const balances = computeBalances(data);
	lines.push("| " + t("thPerson") + " | " + t("thRec") + " | " + t("thDebt") + " | " + t("thNet") + " |");
	lines.push("|---|---:|---:|---:|");
	const sortedPeople = [...data.people].sort((a, b) => {
		const ba = balances.get(a.id),
			bb = balances.get(b.id);
		const na = ba ? Math.abs(ba.net) : 0,
			nb = bb ? Math.abs(bb.net) : 0;
		return nb - na || a.name.localeCompare(b.name)
	});
	for (const p of sortedPeople) {
		const b = balances.get(p.id);
		if (!b) continue;
		if (b.txCount === 0) continue;
		const rec = b.remainingReceivable > EPS ? fmt.num(b.remainingReceivable) : "0";
		const debt = b.remainingDebt > EPS ? fmt.num(b.remainingDebt) : "0";
		const net = fmt.num(b.net);
		lines.push("| " + [p.name, rec, debt, net].join(" | ") + " |")
	}
	lines.push("");
	lines.push("## " + t("ledgerTxH"), "");
	lines.push("| " + [t("thDate"), t("thPerson"), t("thType"), t("thAmount"), t("dCategory"), t("dDesc"), t("dDue")].join(" | ") + " |");
	lines.push("|---|---|---|---:|---|---|---|");
	const txs = [...data.transactions].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
	const nameOf = new Map(data.people.map(p => [p.id, p.name]));
	for (const tx of txs) {
		const dateStr = fmt.dateForNote(tx.date);
		const dueStr = tx.dueDate ? fmt.dateForNote(tx.dueDate) : "";
		const desc = (tx.description || "").replace(/\|/g, "\\|").replace(/\n/g, " ");
		const cat = (tx.category || "").replace(/\|/g, "\\|").replace(/\n/g, " ");
		lines.push("| " + [dateStr, nameOf.get(tx.personId) || "?", typeLabel(tx.type), fmt.num(tx.amount), cat, desc, dueStr].join(" | ") + " |")
	}
	lines.push("");
	lines.push("## " + t("ledgerPeopleDetailsH"), "");
	const hasDetails = data.people.some(p => p.phone || p.email || p.tags && p.tags.length || p.note);
	if (hasDetails) {
		const hName = t("fName").replace(" *", "") || (fa ? "نام" : "Name");
		const hPhone = t("fPhone");
		const hEmail = t("fEmail");
		const hTags = t("fTags");
		const hNote = t("fNote");
		const headers = [hName, hPhone, hEmail, hTags, hNote];
		lines.push("| " + headers.join(" | ") + " |");
		lines.push("|" + "---|".repeat(headers.length));
		const sorted = [...data.people].sort((a, b) => a.name.localeCompare(b.name));
		for (const p of sorted) {
			const esc = s => String(s == null ? "" : s).replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
			const tags = p.tags && p.tags.length ? p.tags.map(x => "`" + x + "`").join(" ") : "";
			const note = p.note ? esc(p.note) : "";
			lines.push("| " + [esc(p.name), esc(p.phone || ""), esc(p.email || ""), tags, note].join(" | ") + " |")
		}
		lines.push("")
	} else {
		lines.push("> " + (fa ? "هنوز اطلاعات تکمیلی برای کسی ثبت نشده است." : "No extra info recorded yet."));
		lines.push("")
	}
	return lines.join("\n")
}

class PluginDataStore {
	constructor(app, getSettings, fmt, plugin) {
		this.app = app;
		this.getSettings = getSettings;
		this.fmt = fmt;
		this.plugin = plugin
	}
	get settings() {
		return this.getSettings()
	}
	get calendar() {
		return this.settings.calendar || "gregorian"
	}
	filePath() {
		return normalizePath((this.settings.filePath || "").trim() || DEFAULT_FILE_PATH)
	}
	async load() {
		const path = this.filePath();
		const file = this.app.vault.getAbstractFileByPath(path);
		if (!(file instanceof TFile)) return emptyData();
		const content = await this.app.vault.read(file);
		try {
			return parseMarkdownData(content, this.calendar)
		} catch (e) {
			console.error("PA parse error:", e);
			return emptyData()
		}
	}
	async save(data) {
		const path = this.filePath();
		const body = renderMarkdownData(data, this.fmt);
		let file = this.app.vault.getAbstractFileByPath(path);
		if (file instanceof TFile) {
			await this.app.vault.modify(file, body)
		} else if (!file) {
			await this.app.vault.create(path, body)
		}
	}
	async writeReadableNote(data) {
		await this.save(data)
	}
}

function addPerson(data, input) {
	const now = Date.now();
	const person = {
		id: randomId("p"),
		name: input.name.trim(),
		phone: (input.phone || "").trim() || undefined,
		email: (input.email || "").trim() || undefined,
		tags: Array.isArray(input.tags) ? input.tags.map(x => String(x).trim()).filter(Boolean) : [],
		note: (input.note || "").trim() || undefined,
		createdAt: now,
		updatedAt: now
	};
	data.people.push(person);
	return person
}

function findPersonByName(data, name) {
	const q = name.trim().toLowerCase();
	return data.people.find(p => p.name.trim().toLowerCase() === q)
}

function updatePerson(data, id, patch) {
	const p = data.people.find(x => x.id === id);
	if (!p) return;
	if (patch.name !== undefined && patch.name.trim()) p.name = patch.name.trim();
	if (patch.phone !== undefined) p.phone = (patch.phone || "").trim() || undefined;
	if (patch.email !== undefined) p.email = (patch.email || "").trim() || undefined;
	if (patch.tags !== undefined) {
		p.tags = Array.isArray(patch.tags) ? patch.tags.map(x => String(x).trim()).filter(Boolean) : []
	}
	if (patch.note !== undefined) p.note = (patch.note || "").trim() || undefined;
	p.updatedAt = Date.now()
}

function deletePerson(data, id) {
	data.people = data.people.filter(p => p.id !== id);
	data.transactions = data.transactions.filter(tx => tx.personId !== id)
}

function addTransaction(data, input) {
	const origin = input.type === "receivable" || input.type === "debt";
	const tx = {
		id: randomId("t"),
		personId: input.personId,
		type: input.type,
		amount: Math.abs(input.amount),
		date: ISO_RE.test(input.date || "") ? input.date : todayISO(),
		description: (input.description || "").trim() || undefined,
		category: (input.category || "").trim() || undefined,
		dueDate: origin && ISO_RE.test(input.dueDate || "") ? input.dueDate : undefined,
		linkedTo: origin ? undefined : input.linkedTo || undefined,
		createdAt: Date.now(),
		updatedAt: Date.now()
	};
	data.transactions.push(tx);
	return tx
}

function updateTransaction(data, id, patch) {
	const tx = data.transactions.find(x => x.id === id);
	if (!tx) return;
	if (patch.type) tx.type = patch.type;
	if (patch.amount !== undefined && Number.isFinite(patch.amount)) tx.amount = Math.abs(patch.amount);
	if (patch.date && ISO_RE.test(patch.date)) tx.date = patch.date;
	if (patch.description !== undefined) tx.description = (patch.description || "").trim() || undefined;
	if (patch.category !== undefined) tx.category = (patch.category || "").trim() || undefined;
	if (patch.personId) tx.personId = patch.personId;
	const origin = tx.type === "receivable" || tx.type === "debt";
	if (!origin) {
		tx.dueDate = undefined;
		if (patch.linkedTo !== undefined) tx.linkedTo = patch.linkedTo || undefined
	} else {
		tx.linkedTo = undefined;
		if (patch.dueDate !== undefined) {
			tx.dueDate = patch.dueDate && ISO_RE.test(patch.dueDate) ? patch.dueDate : undefined
		}
	}
	tx.updatedAt = Date.now()
}

function deleteTransaction(data, id) {
	data.transactions = data.transactions.filter(tx => tx.id !== id);
	for (const tx of data.transactions)
		if (tx.linkedTo === id) tx.linkedTo = undefined
}

function exportToJSON(data) {
	return JSON.stringify(data, null, 2)
}

function exportToCSV(data, fmt) {
	const nameOf = new Map(data.people.map(p => [p.id, p.name]));
	const esc = s => {
		if (s === undefined || s === null) return "";
		const str = String(s);
		if (str.includes(",") || str.includes('"') || str.includes("\n")) {
			return '"' + str.replace(/"/g, '""') + '"'
		}
		return str
	};
	const headers = [t("thDate"), t("thPerson"), t("thType"), t("thAmount"), t("dCategory"), t("dDesc"), t("dDue")];
	const rows = [headers.map(esc).join(",")];
	const txs = [...data.transactions].sort((a, b) => a.date.localeCompare(b.date));
	for (const tx of txs) {
		rows.push([esc(fmt.date(tx.date)), esc(nameOf.get(tx.personId) || "?"), esc(typeLabel(tx.type)), esc(tx.amount), esc(tx.category || ""), esc(tx.description || ""), esc(tx.dueDate ? fmt.date(tx.dueDate) : "")].join(","))
	}
	return "\ufeff" + rows.join("\r\n")
}

function downloadFile(filename, content, mime) {
	const blob = new Blob([content], {
		type: mime
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	setTimeout(() => URL.revokeObjectURL(url), 1e3)
}
let _tooltipEl = null;
let _tooltipTimer = null;
let _tooltipTarget = null;

function showTooltip(target, title, sub) {
	hideTooltip();
	_tooltipEl = el("div", "pa-tooltip");
	_tooltipEl.setAttribute("dir", CURRENT.locale === "fa" ? "rtl" : "ltr");
	if (title) _tooltipEl.createDiv("pa-tooltip-title").setText(title);
	if (sub) _tooltipEl.createDiv("pa-tooltip-sub").setText(sub);
	document.body.appendChild(_tooltipEl);
	positionTooltip(target);
	requestAnimationFrame(() => {
		if (_tooltipEl) _tooltipEl.addClass("pa-tooltip-visible")
	})
}

function positionTooltip(target) {
	if (!_tooltipEl || !target) return;
	const r = target.getBoundingClientRect();
	const tw = _tooltipEl.offsetWidth || 200;
	const th = _tooltipEl.offsetHeight || 40;
	let left = r.left + r.width / 2;
	let top = r.top - 10;
	if (top - th < 8) top = r.bottom + th + 10;
	left = Math.max(tw / 2 + 8, Math.min(window.innerWidth - tw / 2 - 8, left));
	_tooltipEl.style.left = Math.round(left) + "px";
	_tooltipEl.style.top = Math.round(top) + "px"
}

function hideTooltip() {
	if (_tooltipTimer) {
		clearTimeout(_tooltipTimer);
		_tooltipTimer = null
	}
	_tooltipTarget = null;
	if (_tooltipEl) {
		_tooltipEl.remove();
		_tooltipEl = null
	}
}

function attachTooltip(element, title, sub, opts) {
	const o = opts || {};
	const delay = o.delay == null ? 350 : o.delay;
	let finalTitle = title;
	let finalSub = sub;
	if (o.both) {
		const otherLocale = CURRENT.locale === "fa" ? "en" : "fa";
		const otherDict = STRINGS[otherLocale] || {};
		const other = otherDict[title] || null;
		if (other) finalSub = (sub ? sub + "  •  " : "") + other
	}
	const enter = () => {
		if (_tooltipTimer) clearTimeout(_tooltipTimer);
		_tooltipTimer = setTimeout(() => {
			_tooltipTarget = element;
			showTooltip(element, finalTitle, finalSub)
		}, delay)
	};
	const leave = () => hideTooltip();
	const click = () => hideTooltip();
	element.addEventListener("mouseenter", enter);
	element.addEventListener("mouseleave", leave);
	element.addEventListener("focus", enter);
	element.addEventListener("blur", leave);
	element.addEventListener("click", click);
	element.addEventListener("scroll", () => hideTooltip(), {
		passive: true
	})
}

function parseQuery(q) {
	const tokens = q.match(/(\w+):("[^"]+"|\S+)|"[^"]+"|\S+/g) || [];
	const filters = {
		text: [],
		type: [],
		amount: [],
		person: [],
		category: []
	};
	for (const tok of tokens) {
		const m = /^(\w+):("([^"]+)"|(.+))$/.exec(tok);
		if (m) {
			const key = m[1].toLowerCase();
			const val = (m[3] || m[4] || "").trim();
			if (filters[key]) filters[key].push(val);
			else filters.text.push(val)
		} else {
			filters.text.push(tok.replace(/^"|"$/g, ""))
		}
	}
	return filters
}

function matchesQuery(tx, filters, store) {
	const name = store.personName(tx.personId).toLowerCase();
	for (const v of filters.type) {
		if (tx.type !== v.toLowerCase()) return false
	}
	for (const v of filters.person) {
		if (!name.includes(v.toLowerCase())) return false
	}
	for (const v of filters.category) {
		if ((tx.category || "").toLowerCase() !== v.toLowerCase()) return false
	}
	for (const v of filters.amount) {
		const m = /^(>=|<=|>|<|=)?(\d+(?:\.\d+)?)$/.exec(v.replace(/[,٬،]/g, ""));
		if (!m) continue;
		const n = Number(m[2]);
		const op = m[1] || "=";
		if (op === ">" && !(tx.amount > n)) return false;
		if (op === "<" && !(tx.amount < n)) return false;
		if (op === ">=" && !(tx.amount >= n)) return false;
		if (op === "<=" && !(tx.amount <= n)) return false;
		if (op === "=" && tx.amount !== n) return false
	}
	if (filters.text.length) {
		const hay = [name, tx.description || "", tx.category || "", tx.id, String(tx.amount)].join(" ").toLowerCase();
		for (const tok of filters.text) {
			if (!hay.includes(tok.toLowerCase())) return false
		}
	}
	return true
}
class AccountsStore {
	constructor(plugin) {
		this.plugin = plugin;
		this.data = emptyData();
		this.ledger = null;
		this.error = null;
		this.loaded = false;
		this.listeners = new Set
	}
	get fmt() {
		return this.plugin.fmt
	}
	get confirmDelete() {
		return this.plugin.settings.confirmDelete
	}
	personName(id) {
		const p = this.data.people.find(x => x.id === id);
		return p ? p.name : "?"
	}
	person(id) {
		return this.data.people.find(x => x.id === id)
	}
	subscribe(fn) {
		this.listeners.add(fn);
		return () => {
			this.listeners.delete(fn)
		}
	}
	emit() {
		for (const fn of [...this.listeners]) fn()
	}
	recompute() {
		this.ledger = computeLedger(this.data, todayISO(), this.plugin.settings.dueSoonDays)
	}
	async reload() {
		this.error = null;
		try {
			this.data = await this.plugin.repo.load()
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e)
		}
		this.loaded = true;
		this.recompute();
		this.emit()
	}
	async ready() {
		if (!this.loaded) await this.reload()
	}
	async persist() {
		try {
			await this.plugin.repo.save(this.data);
			this.error = null
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
			new Notice("⚠ " + this.error)
		}
		this.recompute();
		this.emit()
	}
	async ensurePerson(name) {
		await this.ready();
		return findPersonByName(this.data, name) || addPerson(this.data, {
			name
		})
	}
	async addPerson(input) {
		await this.ready();
		const p = addPerson(this.data, input);
		await this.persist();
		return p
	}
	async updatePerson(id, patch) {
		await this.ready();
		updatePerson(this.data, id, patch);
		await this.persist()
	}
	async deletePerson(id) {
		await this.ready();
		deletePerson(this.data, id);
		await this.persist()
	}
	async addTransaction(input) {
		await this.ready();
		const tx = addTransaction(this.data, input);
		await this.persist();
		return tx
	}
	async updateTransaction(id, patch) {
		await this.ready();
		updateTransaction(this.data, id, patch);
		await this.persist()
	}
	async deleteTransaction(id) {
		await this.ready();
		deleteTransaction(this.data, id);
		await this.persist()
	}
	async settleTransaction(txId) {
		await this.ready();
		const tx = this.data.transactions.find(x => x.id === txId);
		const st = this.ledger ? this.ledger.states.get(txId) : null;
		if (!tx || !st || st.remaining <= EPS) return;
		await this.addTransaction({
			personId: tx.personId,
			type: tx.type === "receivable" ? "payment_received" : "payment_made",
			amount: st.remaining,
			date: todayISO(),
			description: t("settleFor", {
				id: tx.id
			}) + (tx.description ? " (" + tx.description + ")" : ""),
			category: tx.category,
			linkedTo: tx.id
		})
	}
	/* ✅ FIX #5: settlePerson اتمیک با rollback */
	async settlePerson(personId) {
		await this.ready();
		const b = this.ledger ? this.ledger.balances.get(personId) : null;
		if (!b) return;
		const snapshot = JSON.parse(JSON.stringify(this.data));
		try {
			if (b.remainingReceivable > EPS) {
				addTransaction(this.data, {
					personId,
					type: "payment_received",
					amount: b.remainingReceivable,
					date: todayISO(),
					description: t("accountSettlement")
				})
			}
			if (b.remainingDebt > EPS) {
				addTransaction(this.data, {
					personId,
					type: "payment_made",
					amount: b.remainingDebt,
					date: todayISO(),
					description: t("accountSettlement")
				})
			}
			await this.persist()
		} catch (e) {
			this.data = snapshot;
			this.recompute();
			this.emit();
			throw e
		}
	}
	async resetEmpty() {
		this.data = emptyData();
		await this.persist()
	}
}
const DEFAULT_SETTINGS = {
	filePath: DEFAULT_FILE_PATH,
	currency: "usd",
	locale: "en",
	calendar: "gregorian",
	dateFormat: "YYYY-MM-DD",
	dueSoonDays: 7,
	compact: false,
	confirmDelete: true,
	openAfterAdd: false,
	savedViews: [],
	recurringTemplates: [],
	settingsVersion: 4,
	_migratedToMd: false,
	_hadDataBefore: false
};
class PASettingTab extends PluginSettingTab {
	constructor(app, plugin) {
		super(app, plugin);
		this.plugin = plugin
	}
	display() {
		const {
			containerEl
		} = this;
		containerEl.empty();

		/* ✅ FIX: کلاس pa-rtl-modal روی تنظیمات حذف شد؛ تنظیمات دست‌نخورده می‌ماند */
		const s = this.plugin.settings;
		const save = async fn => {
			fn();
			await this.plugin.saveSettings()
		};
		containerEl.createEl("h3", {
			text: t("setLang")
		});
		new Setting(containerEl).setName(t("setLang")).addDropdown(d => {
			d.addOption("fa", "فارسی");
			d.addOption("en", "English");
			d.setValue(s.locale);
			d.onChange(v => {
				save(() => {
					s.locale = v
				}).then(() => this.display())
			})
		});
		new Setting(containerEl).setName(t("setCurrency")).setDesc(t("setCurrencyDesc")).addDropdown(d => {
			const fa = CURRENT.locale === "fa";
			for (const c of CURRENCIES) d.addOption(c.code, fa ? c.labelFa : c.label);
			d.setValue(s.currency);
			d.onChange(v => save(() => {
				s.currency = v
			}))
		});
		containerEl.createEl("h3", {
			text: t("setStorage")
		});
		new Setting(containerEl).setName(t("setCentralFile")).setDesc(t("setCentralFileDesc")).addText(tx => tx.setPlaceholder(DEFAULT_FILE_PATH).setValue(s.filePath).onChange(v => save(() => {
			s.filePath = v.trim() || DEFAULT_FILE_PATH
		}))).addButton(b => b.setButtonText(t("openFile")).onClick(async () => {
			try {
				const path = normalizePath((s.filePath || "").trim() || DEFAULT_FILE_PATH);
				let file = this.app.vault.getAbstractFileByPath(path);
				if (!(file instanceof TFile)) {
					await this.plugin.repo.writeReadableNote(this.plugin.accounts.data);
					file = this.app.vault.getAbstractFileByPath(path)
				}
				if (file instanceof TFile) await this.app.workspace.getLeaf("tab").openFile(file)
			} catch (e) {
				new Notice(String(e instanceof Error ? e.message : e))
			}
		}));
		containerEl.createEl("h3", {
			text: t("setCategories")
		});
		new Setting(containerEl).setName(t("setCategories")).setDesc(t("setCategoriesDesc")).addTextArea(tx => {
			tx.setValue(this.plugin.settings.categories.join("\n"));
			tx.inputEl.rows = 6;
			tx.onChange(async v => {
				this.plugin.settings.categories = v.split("\n").map(x => x.trim()).filter(Boolean);
				await this.plugin.saveSettings()
			})
		});
		containerEl.createEl("h3", {
			text: t("setBackup")
		});
		new Setting(containerEl).setName(t("setExportJSON")).setDesc(t("setExportJSONDesc")).addButton(b => b.setButtonText(t("exportBtn")).onClick(async () => {
			try {
				await this.plugin.accounts.ready();
				const json = exportToJSON(this.plugin.accounts.data);
				downloadFile("personal-accounts-" + (new Date).toISOString().slice(0, 10) + ".json", json, "application/json;charset=utf-8");
				new Notice(t("exportDone"))
			} catch (e) {
				new Notice("⚠ " + (e instanceof Error ? e.message : String(e)))
			}
		}));
		new Setting(containerEl).setName(t("setExportCSV")).setDesc(t("setExportCSVDesc")).addButton(b => b.setButtonText(t("exportBtn")).onClick(async () => {
			try {
				await this.plugin.accounts.ready();
				const csv = exportToCSV(this.plugin.accounts.data, this.plugin.fmt);
				downloadFile("personal-accounts-" + (new Date).toISOString().slice(0, 10) + ".csv", csv, "text/csv;charset=utf-8");
				new Notice(t("exportDone"))
			} catch (e) {
				new Notice("⚠ " + (e instanceof Error ? e.message : String(e)))
			}
		}));
		/* ✅ FIX #32: ایمپورت JSON با ConfirmModal */
		new Setting(containerEl).setName(t("setImportJSON")).setDesc(t("setImportJSONDesc")).addButton(b => b.setButtonText(t("importBtn")).onClick(() => {
			const input = document.createElement("input");
			input.type = "file";
			input.accept = ".json,application/json";
			input.onchange = async e => {
				const file = e.target.files && e.target.files[0];
				if (!file) return;
				let parsed;
				try {
					const text = await file.text();
					parsed = JSON.parse(text)
				} catch (err) {
					new Notice("⚠ " + t("importError") + ": " + (err instanceof Error ? err.message : String(err)));
					return
				}
				const clean = sanitizeData(parsed);
				const txCount = clean.transactions.length;
				const peopleCount = clean.people.length;
				new ConfirmModal(this.app, {
					title: t("setImportJSON"),
					lines: [peopleCount + " " + t("tabPeople") + " · " + txCount + " " + t("tabTransactions"), t("setImportJSONDesc")],
					confirmLabel: t("importBtn"),
					danger: true,
					onConfirm: async () => {
						try {
							this.plugin.accounts.data = clean;
							await this.plugin.accounts.persist();
							new Notice(t("importDone"))
						} catch (err) {
							new Notice("⚠ " + t("importError") + ": " + (err instanceof Error ? err.message : String(err)))
						}
					}
				}).open()
			};
			input.click()
		}));
		new Setting(containerEl).setName(t("setCalendar")).setDesc(t("setCalendarDesc")).addDropdown(d => {
			d.addOption("jalali", t("calJalali"));
			d.addOption("gregorian", t("calGregorian"));
			d.setValue(s.calendar);
			d.onChange(v => save(() => {
				s.calendar = v
			}))
		});
		new Setting(containerEl).setName(t("setDateFormat")).setDesc(t("setDateFormatDesc")).addText(tx => tx.setValue(s.dateFormat).onChange(v => save(() => {
			s.dateFormat = v
		})));
		new Setting(containerEl).setName(t("setCompact")).addToggle(tg => tg.setValue(s.compact).onChange(v => save(() => {
			s.compact = v
		})));
		new Setting(containerEl).setName(t("setDueSoon")).addText(tx => tx.setValue(String(s.dueSoonDays)).onChange(v => {
			const n = parseInt(v, 10);
			if (!Number.isNaN(n) && n >= 0) save(() => {
				s.dueSoonDays = n
			})
		}));
		new Setting(containerEl).setName(t("setConfirmDel")).addToggle(tg => tg.setValue(s.confirmDelete).onChange(v => save(() => {
			s.confirmDelete = v
		})));
		new Setting(containerEl).setName(t("setOpenAfterAdd")).addToggle(tg => tg.setValue(s.openAfterAdd).onChange(v => save(() => {
			s.openAfterAdd = v
		})));
		renderCreatorSupport(containerEl, this.plugin.settings.locale || 'fa');
	}
}

function iconButton(name, title, onClick, tipKey) {
	const b = el("button", "pa-btn small icon");
	b.title = title;
	setIcon(b, name);
	b.addEventListener("click", onClick);
	if (tipKey) attachTooltip(b, t(tipKey), title, {
		both: true
	});
	return b
}

function dueChip(due, fallbackLabel) {
	const c = el("span", "pa-chip" + (due.kind === "future" ? "" : " " + due.kind), due.label || fallbackLabel);
	attachTooltip(c, t("tipDueChip"), due.label || fallbackLabel, {
		both: true,
		delay: 500
	});
	return c
}

/* ✅ FIX: modalRtl کلاس pa-plugin-modal را هم اضافه می‌کند تا CSS RTL مودال اعمال شود */
function modalRtl(modal) {
	modal.modalEl.addClass("pa-plugin-modal");
	if (CURRENT.locale === "fa") modal.modalEl.addClass("pa-rtl-modal")
}

function inputText(placeholder) {
	const i = el("input");
	i.type = "text";
	if (placeholder) i.placeholder = placeholder;
	return i
}

function field(parent, label, input) {
	const w = parent.createDiv("pa-field");
	w.createEl("label").setText(label);
	w.appendChild(input);
	return w
}

function attachMobileKeyboardHandler(modal) {
	if (!modal.app.isMobile) return () => {};
	const modalEl = modal.modalEl;
	const content = modal.contentEl;
	const vv = window.visualViewport;
	if (!vv) return () => {};
	let rafId = null;
	let scrollTimer = null;
	const updateLayout = () => {
		if (rafId) cancelAnimationFrame(rafId);
		rafId = requestAnimationFrame(() => {
			const viewportHeight = vv.height;
			const viewportTop = vv.offsetTop;
			const keyboardHeight = window.innerHeight - viewportHeight;
			const keyboardOpen = keyboardHeight > 150;
			let modalHeight;
			if (keyboardOpen) {
				modalHeight = Math.max(220, viewportHeight - 24)
			} else {
				modalHeight = Math.min(window.innerHeight * .85, viewportHeight * .92)
			}
			const top = keyboardOpen ? viewportTop + 8 : Math.max(16, viewportTop + (viewportHeight - modalHeight) / 2);
			modalEl.style.setProperty("--pa-modal-height", modalHeight + "px");
			modalEl.style.setProperty("--pa-modal-top", top + "px");
			if (keyboardOpen) modalEl.addClass("pa-keyboard-open");
			else modalEl.removeClass("pa-keyboard-open");
			scheduleScroll()
		})
	};
	const scrollActiveIntoView = () => {
		const active = document.activeElement;
		if (!active || !content.contains(active)) return;
		if (!/^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)) return;
		const vv2 = window.visualViewport;
		const viewportBottom = vv2 ? vv2.offsetTop + vv2.height : window.innerHeight;
		const safeBottom = viewportBottom - 120;
		const rect = active.getBoundingClientRect();
		if (rect.bottom > safeBottom) {
			const delta = rect.bottom - safeBottom;
			content.scrollTop += delta + 24
		}
	};
	const scheduleScroll = () => {
		if (scrollTimer) clearTimeout(scrollTimer);
		scrollTimer = setTimeout(() => {
			scrollActiveIntoView();
			setTimeout(scrollActiveIntoView, 80);
			setTimeout(scrollActiveIntoView, 200);
			setTimeout(scrollActiveIntoView, 400)
		}, 50)
	};
	const onFocusIn = e => {
		const tag = e.target.tagName;
		if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT") {
			scheduleScroll();
			setTimeout(scrollActiveIntoView, 200);
			setTimeout(scrollActiveIntoView, 400);
			setTimeout(scrollActiveIntoView, 700);
			setTimeout(scrollActiveIntoView, 1e3)
		}
	};
	const onInput = e => {
		if (e.target.tagName === "TEXTAREA") scrollActiveIntoView()
	};
	const onFocusOut = () => setTimeout(updateLayout, 120);
	content.addEventListener("focusin", onFocusIn);
	content.addEventListener("focusout", onFocusOut);
	content.addEventListener("input", onInput, true);
	vv.addEventListener("resize", updateLayout);
	vv.addEventListener("scroll", updateLayout);
	updateLayout();
	return () => {
		if (rafId) cancelAnimationFrame(rafId);
		if (scrollTimer) clearTimeout(scrollTimer);
		content.removeEventListener("focusin", onFocusIn);
		content.removeEventListener("focusout", onFocusOut);
		content.removeEventListener("input", onInput, true);
		vv.removeEventListener("resize", updateLayout);
		vv.removeEventListener("scroll", updateLayout);
		modalEl.style.removeProperty("--pa-modal-height");
		modalEl.style.removeProperty("--pa-modal-top");
		modalEl.removeClass("pa-keyboard-open")
	}
}
let activePicker = null;

function closeActivePicker() {
	if (activePicker) {
		const p = activePicker;
		activePicker = null;
		try {
			p.close()
		} catch (e) {}
	}
}
const jalaliAdapter = {
	todayParts() {
		const j = Cal.isoToJ(todayISO());
		return j ? {
			y: j.jy,
			m: j.jm,
			d: j.jd
		} : {
			y: 1404,
			m: 1,
			d: 1
		}
	},
	fromISO(iso) {
		const j = Cal.isoToJ(iso);
		return j ? {
			y: j.jy,
			m: j.jm,
			d: j.jd
		} : null
	},
	toISO(p) {
		return Cal.jToISO(p.y, p.m, p.d)
	},
	monthName(m) {
		return Cal.monthName(m)
	},
	monthLen(y, m) {
		return Cal.monthLen(y, m)
	},
	partsToDate(y, m, d) {
		const g = Cal.jToG(y, m, d);
		return Cal.dateAtNoon(g.gy, g.gm, g.gd)
	}
};
const gregorianAdapter = {
	todayParts() {
		return gregParts(todayISO()) || {
			y: 2024,
			m: 1,
			d: 1
		}
	},
	fromISO(iso) {
		return gregParts(iso)
	},
	toISO(p) {
		return p.y + "-" + pad2(p.m) + "-" + pad2(p.d)
	},
	monthName(m) {
		return gregMonthName(m)
	},
	monthLen(y, m) {
		return new Date(Date.UTC(y, m, 0)).getUTCDate()
	},
	partsToDate(y, m, d) {
		return Cal.dateAtNoon(y, m, d)
	}
};

function createDatePicker(calendar, fa) {
	const A = calendar === "jalali" ? jalaliAdapter : gregorianAdapter;
	const weekStart = calendar === "jalali" || fa ? 6 : 0;
	const root = el("div", "pa-datefield");
	const btn = el("button", "pa-date-btn");
	btn.type = "button";
	const icon = el("span", "pa-date-icon");
	setIcon(icon, "calendar");
	const label = el("span", "pa-date-label");
	btn.append(icon, label);
	root.appendChild(btn);
	let iso = "";
	let view = null;
	let pop = null;
	let isOpen = false;

	function viewFromISO(v) {
		if (v) {
			const p = A.fromISO(v);
			if (p) return {
				y: p.y,
				m: p.m
			}
		}
		const tp = A.todayParts();
		return {
			y: tp.y,
			m: tp.m
		}
	}

	function displayText() {
		if (!iso) return t("pickDate");
		let shown = iso;
		if (calendar === "jalali") {
			const j = Cal.isoToJ(iso);
			if (j) shown = localizeDigits(String(j.jd), fa) + " " + Cal.monthName(j.jm) + " " + localizeDigits(String(j.jy), fa)
		} else {
			const p = gregParts(iso);
			if (p) shown = localizeDigits(String(p.d), fa) + " " + gregMonthName(p.m) + " " + localizeDigits(String(p.y), fa)
		}
		const wd = isoWeekday(iso);
		return shown + (wd === null ? "" : " · " + Cal.weekdayName(wd))
	}

	function syncDisplay() {
		label.textContent = displayText();
		btn.toggleClass("pa-empty-date", !iso)
	}

	function shiftMonths(k) {
		const idx = view.y * 12 + (view.m - 1) + k;
		view = {
			y: Math.floor(idx / 12),
			m: (idx % 12 + 12) % 12 + 1
		};
		renderCal()
	}

	function renderCal() {
		if (!pop) return;
		pop.empty();
		const head = el("div", "pa-cal-head");
		const prevY = el("button", "pa-cal-nav", "«");
		prevY.type = "button";
		const prevM = el("button", "pa-cal-nav", "‹");
		prevM.type = "button";
		const title = el("div", "pa-cal-title", A.monthName(view.m) + " " + localizeDigits(String(view.y), fa));
		const nextM = el("button", "pa-cal-nav", "›");
		nextM.type = "button";
		const nextY = el("button", "pa-cal-nav", "»");
		nextY.type = "button";
		prevY.onclick = e => {
			e.preventDefault();
			e.stopPropagation();
			shiftMonths(-12)
		};
		prevM.onclick = e => {
			e.preventDefault();
			e.stopPropagation();
			shiftMonths(-1)
		};
		nextM.onclick = e => {
			e.preventDefault();
			e.stopPropagation();
			shiftMonths(1)
		};
		nextY.onclick = e => {
			e.preventDefault();
			e.stopPropagation();
			shiftMonths(12)
		};
		head.append(prevY, prevM, title, nextM, nextY);
		pop.appendChild(head);
		const grid = el("div", "pa-cal-grid");
		for (let i = 0; i < 7; i++) {
			grid.appendChild(el("div", "pa-cal-wd", Cal.weekdayName((weekStart + i) % 7, CURRENT.locale, true)))
		}
		const first = A.partsToDate(view.y, view.m, 1);
		const firstCol = (first.getUTCDay() - weekStart + 7) % 7;
		for (let i = 0; i < firstCol; i++) grid.appendChild(el("span"));
		const len = A.monthLen(view.y, view.m);
		const todayIsoVal = todayISO();
		for (let d = 1; d <= len; d++) {
			const pISO = A.toISO({
				y: view.y,
				m: view.m,
				d
			});
			const dateObj = A.partsToDate(view.y, view.m, d);
			const cls = ["pa-cal-day"];
			if (pISO === todayIsoVal) cls.push("today");
			if (iso && pISO === iso) cls.push("selected");
			const holiday = Cal.isHoliday(dateObj) || (calendar === "jalali" || fa) && dateObj.getUTCDay() === 5;
			if (holiday) cls.push("holiday");
			const cell = el("button", cls.join(" "), localizeDigits(String(d), fa));
			cell.type = "button";
			const evs = Cal.eventsOf(dateObj);
			cell.title = Cal.weekdayName(dateObj.getUTCDay()) + " " + localizeDigits(view.y + "/" + view.m + "/" + d, fa) + (evs.length ? "\n" + evs.join(" • ") : "");
			if (evs.length) cell.appendChild(el("span", "pa-cal-dot"));
			cell.onclick = e => {
				e.preventDefault();
				e.stopPropagation();
				iso = pISO;
				syncDisplay();
				closePop()
			};
			grid.appendChild(cell)
		}
		pop.appendChild(grid);
		const foot = el("div", "pa-cal-foot");
		const todayBtn = el("button", "pa-btn small", t("todayBtn"));
		todayBtn.type = "button";
		todayBtn.onclick = e => {
			e.preventDefault();
			e.stopPropagation();
			iso = todayIsoVal;
			view = viewFromISO(iso);
			syncDisplay();
			closePop()
		};
		const clearBtn = el("button", "pa-btn small", t("clearBtn"));
		clearBtn.type = "button";
		clearBtn.onclick = e => {
			e.preventDefault();
			e.stopPropagation();
			iso = "";
			syncDisplay();
			closePop()
		};
		foot.append(todayBtn, clearBtn);
		pop.appendChild(foot)
	}

	function positionPop() {
		if (!pop) return;
		const r = btn.getBoundingClientRect();
		if (!r.width && !r.height || !btn.isConnected) {
			closePop();
			return
		}
		const w = pop.offsetWidth || 268;
		const h = pop.offsetHeight || 320;
		let left = r.left;
		if (left + w > window.innerWidth - 8) left = window.innerWidth - w - 8;
		if (left < 8) left = 8;
		let top = r.bottom + 4;
		if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 4);
		pop.style.left = Math.round(left) + "px";
		pop.style.top = Math.round(top) + "px"
	}
	const onDocPointer = e => {
		if (!isOpen) return;
		if (!btn.isConnected) {
			closePop();
			return
		}
		const target = e.target;
		if (target instanceof Node) {
			if (pop && pop.contains(target)) return;
			if (btn.contains(target)) return
		}
		closePop()
	};
	const onDocKey = e => {
		if (!isOpen) return;
		if (e.key === "Escape") {
			e.preventDefault();
			e.stopPropagation();
			closePop()
		} else if (e.key === "Tab") closePop()
	};
	const onReposition = () => {
		if (isOpen) positionPop()
	};

	function openPop() {
		if (isOpen) {
			closePop();
			return
		}
		closeActivePicker();
		Cal.ensure(Cal.appRef);
		view = viewFromISO(iso);
		pop = el("div", "pa-cal-pop");
		pop.setAttribute("dir", fa ? "rtl" : "ltr");
		renderCal();
		document.body.appendChild(pop);
		pop.style.visibility = "hidden";
		positionPop();
		pop.style.visibility = "";
		isOpen = true;
		btn.addClass("pa-open");
		activePicker = api;
		document.addEventListener("pointerdown", onDocPointer, true);
		document.addEventListener("mousedown", onDocPointer, true);
		document.addEventListener("keydown", onDocKey, true);
		window.addEventListener("resize", onReposition);
		window.addEventListener("scroll", onReposition, true)
	}

	function closePop() {
		if (!isOpen && !pop) return;
		isOpen = false;
		btn.removeClass("pa-open");
		if (pop) {
			pop.remove();
			pop = null
		}
		document.removeEventListener("pointerdown", onDocPointer, true);
		document.removeEventListener("mousedown", onDocPointer, true);
		document.removeEventListener("keydown", onDocKey, true);
		window.removeEventListener("resize", onReposition);
		window.removeEventListener("scroll", onReposition, true);
		if (activePicker === api) activePicker = null
	}
	btn.addEventListener("click", e => {
		e.preventDefault();
		e.stopPropagation();
		if (isOpen) closePop();
		else openPop()
	});
	const api = {
		el: root,
		get: () => iso,
		set: v => {
			iso = v || "";
			view = viewFromISO(iso);
			syncDisplay()
		},
		close: closePop
	};
	syncDisplay();
	return api
}

/* ✅ FIX #22: TextPromptModal — جایگزین prompt() */
class TextPromptModal extends Modal {
	constructor(app, opts) {
		super(app);
		this.opts = opts
	}
	onOpen() {
		modalRtl(this);
		this.titleEl.setText(this.opts.title || "");
		const form = this.contentEl.createDiv("pa-form");
		if (this.opts.desc) form.createDiv("pa-muted").setText(this.opts.desc);
		const input = inputText(this.opts.placeholder || "");
		input.value = this.opts.value || "";
		field(form, this.opts.label || "", input);
		const err = form.createDiv("pa-form-error");
		const fail = m => {
			err.setText(m);
			err.addClass("show")
		};
		const submit = async () => {
			const v = input.value.trim();
			if (!v) return fail(this.opts.requiredMsg || t("nameRequired"));
			if (this.opts.validate) {
				const msg = this.opts.validate(v);
				if (msg) return fail(msg)
			}
			this.close();
			await this.opts.onSubmit(v)
		};
		const actions = form.createDiv("pa-actions");
		const cancel = el("button", "pa-btn", t("cancel"));
		cancel.onclick = () => this.close();
		const ok = el("button", "pa-btn primary", this.opts.confirmLabel || t("save"));
		ok.onclick = submit;
		actions.append(cancel, ok);
		form.addEventListener("keydown", e => {
			if (e.key === "Enter") {
				e.preventDefault();
				void submit()
			}
		});
		this.modalEl.addClass("pa-mobile-modal");
		this._cleanupKeyboard = attachMobileKeyboardHandler(this);
		input.focus()
	}
	onClose() {
		if (this._cleanupKeyboard) this._cleanupKeyboard();
		this.contentEl.empty()
	}
}

class HelpModal extends Modal {
	constructor(app, title, body) {
		super(app);
		this._title = title;
		this._body = body
	}
	onOpen() {
		modalRtl(this);
		this.titleEl.setText(this._title);
		this.contentEl.createDiv("pa-help-body").setText(this._body);
		const actions = this.contentEl.createDiv("pa-actions");
		const closeBtn = el("button", "pa-btn primary", t("close"));
		closeBtn.onclick = () => this.close();
		actions.appendChild(closeBtn)
	}
	onClose() {
		this.contentEl.empty()
	}
}

function helpIcon(app, tipKey) {
	const btn = el("button", "pa-help-btn");
	btn.type = "button";
	setIcon(btn, "help-circle");
	attachTooltip(btn, t("helpTitle"), t(tipKey), {
		both: true,
		delay: 150
	});
	btn.onclick = e => {
		e.preventDefault();
		e.stopPropagation();
		new HelpModal(app, t("helpTitle"), t(tipKey)).open()
	};
	return btn
}
class ConfirmModal extends Modal {
	constructor(app, opts) {
		super(app);
		this.opts = opts
	}
	onOpen() {
		modalRtl(this);
		this.titleEl.setText(this.opts.title);
		for (const line of this.opts.lines) this.contentEl.createDiv("pa-muted").setText(line);
		const actions = this.contentEl.createDiv("pa-actions");
		const cancel = el("button", "pa-btn", t("cancel"));
		cancel.onclick = () => this.close();
		const ok = el("button", "pa-btn " + (this.opts.danger ? "danger" : "primary"), this.opts.confirmLabel || t("confirm"));
		ok.onclick = async () => {
			this.close();
			await this.opts.onConfirm()
		};
		actions.append(cancel, ok)
	}
	onClose() {
		this.contentEl.empty()
	}
}
class PersonModal extends Modal {
	constructor(app, store, person, opts = {}) {
		super(app);
		this.store = store;
		this.person = person;
		this.opts = opts
	}
	onOpen() {
		modalRtl(this);
		const p = this.person;
		this.titleEl.setText(p ? t("editPersonTitle") : t("addPersonTitle"));
		const form = this.contentEl.createDiv("pa-form");
		const err = form.createDiv("pa-form-error");
		const fail = m => {
			err.setText(m);
			err.addClass("show")
		};
		const name = inputText(t("phName"));
		name.value = p ? p.name : "";
		field(form, t("fName"), name);
		const phone = inputText(t("phPhone"));
		phone.type = "tel";
		phone.value = p && p.phone || "";
		field(form, t("fPhone"), phone);
		const email = inputText(t("phEmail"));
		email.type = "email";
		email.value = p && p.email || "";
		field(form, t("fEmail"), email);
		const tags = inputText(t("phTags"));
		tags.value = p && p.tags && p.tags.length ? p.tags.join("، ") : "";
		const tagsField = field(form, t("fTags"), tags);
		tagsField.createDiv("pa-hint").setText(t("fTagsHint"));
		const note = document.createElement("textarea");
		note.rows = 4;
		note.placeholder = t("phNote");
		note.value = p && p.note || "";
		field(form, t("fNote"), note);
		const submit = async () => {
			const n = name.value.trim();
			if (!n) return fail(t("nameRequired"));
			const parsedTags = tags.value.split(/[,،\n]+/).map(x => x.trim()).filter(Boolean);
			const payload = {
				name: n,
				phone: phone.value.trim(),
				email: email.value.trim(),
				tags: parsedTags,
				note: note.value.trim()
			};
			if (p) await this.store.updatePerson(p.id, payload);
			else await this.store.addPerson(payload);
			new Notice(t("personSaved"));
			if (this.opts.onSaved) this.opts.onSaved();
			this.close()
		};
		const actions = form.createDiv("pa-actions");
		const cancel = el("button", "pa-btn", t("cancel"));
		cancel.onclick = () => this.close();
		const saveBtn = el("button", "pa-btn primary", t("save"));
		saveBtn.onclick = submit;
		actions.append(cancel, saveBtn);
		form.addEventListener("keydown", e => {
			if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
				e.preventDefault();
				void submit()
			}
		});
		this.modalEl.addClass("pa-mobile-modal");
		this._cleanupKeyboard = attachMobileKeyboardHandler(this);
		name.focus()
	}
	onClose() {
		if (this._cleanupKeyboard) this._cleanupKeyboard();
		this.contentEl.empty()
	}
}
class TransactionFormModal extends Modal {
	constructor(app, store, existing, opts = {}) {
		super(app);
		this.store = store;
		this.existing = existing;
		this.opts = opts;
		this.type = existing ? existing.type : opts.preset && opts.preset.type || "receivable";
		this._calCloses = []
	}
	onOpen() {
		modalRtl(this);
		const preset = this.opts.preset || {};
		const editing = !!this.existing;
		const fa = CURRENT.locale === "fa";
		const calendar = this.store.plugin.settings.calendar;
		Cal.ensure(this.store.plugin.app);
		this.titleEl.setText(editing ? t("editTxTitle") : t("addTxTitle"));
		const form = this.contentEl.createDiv("pa-form");
		const err = form.createDiv("pa-form-error");
		const fail = m => {
			err.setText(m);
			err.addClass("show")
		};
		const amount = inputText(t("phAmount"));
		amount.inputMode = "decimal";
		amount.value = editing ? String(this.existing.amount) : preset.amount != null ? String(preset.amount) : "";
		const amtFmt = attachAmountInput(amount, () => CURRENT.locale === "fa");
		amtFmt.refresh();
		field(form, t("fAmount"), amount);
		attachTooltip(amount, t("tipAmount"), null, {
			both: true,
			delay: 700
		});
		let dueField = null;
		const updateDueVisibility = () => {
			if (!dueField) return;
			const origin = this.type === "receivable" || this.type === "debt";
			dueField.toggleClass("pa-hidden", !origin)
		};
		const typeWrap = form.createDiv("pa-field");
		typeWrap.createEl("label").setText(t("fType"));
		const seg = el("div", "pa-seg");
		typeWrap.appendChild(seg);
		const typeOptions = preset.paymentOnly ? ["payment_received", "payment_made"] : ["receivable", "debt", "payment_received", "payment_made"];
		const segBtns = new Map;
		for (const ty of typeOptions) {
			const b = el("button", "pa-btn" + (ty === this.type ? " active" : ""), typeLabel(ty));
			b.setAttribute("data-type", ty);
			b.onclick = () => {
				this.type = ty;
				segBtns.forEach((bb, tt) => bb.toggleClass("active", tt === ty));
				updateDueVisibility()
			};
			segBtns.set(ty, b);
			seg.appendChild(b)
		}
		const lockedPersonId = preset.lockPerson ? this.existing ? this.existing.personId : preset.personId || "" : "";
		const personWrap = form.createDiv("pa-field");
		personWrap.createEl("label").setText(t("fPerson"));
		let personInput = null;
		if (lockedPersonId) {
			personWrap.appendChild(el("span", "pa-locked", this.store.personName(lockedPersonId)))
		} else {
			personInput = inputText(t("phPerson"));
			personInput.setAttribute("list", "pa-person-options");
			personInput.value = this.existing ? this.store.personName(this.existing.personId) : preset.personName || "";
			personWrap.appendChild(personInput);
			const dl = document.createElement("datalist");
			dl.id = "pa-person-options";
			for (const p of this.store.data.people) dl.appendChild(new Option(p.name, p.name));
			personWrap.appendChild(dl)
		}
		const dateCtl = createDatePicker(calendar, fa);
		this._calCloses.push(dateCtl.close);
		field(form, t("fDate"), dateCtl.el);
		dateCtl.set(editing ? this.existing.date : todayISO());
		attachTooltip(dateCtl.el, t("tipDatePicker"), null, {
			delay: 700
		});
		const dueCtl = createDatePicker(calendar, fa);
		this._calCloses.push(dueCtl.close);
		dueField = field(form, t("fDue"), dueCtl.el);
		dueCtl.set(editing && this.existing.dueDate ? this.existing.dueDate : "");
		updateDueVisibility();
		const catSel = document.createElement("select");
		catSel.appendChild(new Option(t("noCategory"), ""));
		for (const c of this.store.plugin.settings.categories) {
			catSel.appendChild(new Option(c, c))
		}
		catSel.value = this.existing && this.existing.category || "";
		field(form, t("fCategory"), catSel);
		const desc = inputText(t("phDesc"));
		desc.value = this.existing && this.existing.description || "";
		field(form, t("fDesc"), desc);
		const submit = async () => {
			let amountVal = parseAmount(amount.value);
			if (amountVal === null) amountVal = evalAmountExpr(amount.value);
			if (amountVal === null || amountVal <= 0) return fail(t("amountInvalid"));
			let personId = lockedPersonId;
			if (!personId) {
				const nameVal = personInput.value.trim();
				if (!nameVal) return fail(t("personRequired"));
				personId = (await this.store.ensurePerson(nameVal)).id
			}
			const origin = this.type === "receivable" || this.type === "debt";
			const common = {
				type: this.type,
				amount: amountVal,
				date: dateCtl.get() || todayISO(),
				category: catSel.value || undefined,
				description: desc.value.trim() || undefined,
				dueDate: origin && dueCtl.get() ? dueCtl.get() : undefined
			};
			if (editing) await this.store.updateTransaction(this.existing.id, Object.assign({}, common, {
				personId
			}));
			else await this.store.addTransaction(Object.assign({}, common, {
				personId,
				linkedTo: preset.linkedTo
			}));
			new Notice(editing ? t("txUpdated") : t("txAdded"));
			if (this.opts.onSaved) this.opts.onSaved();
			this.close()
		};
		const actions = form.createDiv("pa-actions");
		const cancel = el("button", "pa-btn", t("cancel"));
		cancel.onclick = () => this.close();
		const saveBtn = el("button", "pa-btn primary", editing ? t("save") : t("addTxTitle"));
		saveBtn.onclick = submit;
		actions.append(cancel, saveBtn);
		form.addEventListener("keydown", e => {
			if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
				e.preventDefault();
				void submit()
			}
		});
		this.modalEl.addClass("pa-mobile-modal");
		this._cleanupKeyboard = attachMobileKeyboardHandler(this);
		amount.focus()
	}
	onClose() {
		if (this._cleanupKeyboard) this._cleanupKeyboard();
		closeActivePicker();
		for (const c of this._calCloses) {
			try {
				c()
			} catch (e) {}
		}
		this._calCloses = [];
		this.contentEl.empty()
	}
}
class TransactionDetailModal extends Modal {
	constructor(app, store, tx, opts = {}) {
		super(app);
		this.store = store;
		this.tx = tx;
		this.opts = opts
	}
	onOpen() {
		modalRtl(this);
		const fmt = this.store.fmt;
		const tx = this.tx;
		const st = this.store.ledger ? this.store.ledger.states.get(tx.id) : null;
		const origin = tx.type === "receivable" || tx.type === "debt";
		this.titleEl.setText(typeLabel(tx.type));
		const box = this.contentEl.createDiv("pa-detail");
		const rows = [
			[t("dPerson"), this.store.personName(tx.personId)],
			[t("dAmount"), fmt.amount(tx.amount)],
			[t("dDate"), fmt.date(tx.date)]
		];
		if (tx.category) rows.push([t("dCategory"), tx.category]);
		if (origin && st) {
			rows.push([t("dStatus"), st.status === "settled" ? t("settled") : st.status === "partial" ? t("statusPartial", {
				amt: fmt.amount(st.remaining)
			}) : t("statusOpen")]);
			if (tx.dueDate) {
				rows.push([t("dDue"), fmt.date(tx.dueDate) + (st.due && st.due.label ? " (" + st.due.label + ")" : "")])
			}
		}
		if (tx.description) rows.push([t("dDesc"), tx.description]);
		if (tx.linkedTo) rows.push([t("dLinked"), t("settleFor", {
			id: tx.linkedTo
		})]);
		for (const [k, v] of rows) {
			const r = box.createDiv("pa-detail-row");
			r.createDiv("pa-detail-key").setText(k);
			r.createDiv("pa-detail-val").setText(v)
		}
		const actions = this.contentEl.createDiv("pa-actions");
		const edit = el("button", "pa-btn", t("edit"));
		edit.onclick = () => {
			this.close();
			new TransactionFormModal(this.app, this.store, tx, {
				onSaved: this.opts.onChanged
			}).open()
		};
		actions.appendChild(edit);
		if (origin && st && st.remaining > EPS) {
			const settle = el("button", "pa-btn primary", t("settleRemaining"));
			attachTooltip(settle, t("tipSettleRemaining"), null, {
				both: true
			});
			settle.onclick = () => {
				this.close();
				new ConfirmModal(this.app, {
					title: t("settleTxTitle"),
					lines: [tx.type === "receivable" ? t("settleRecLine", {
						amt: fmt.amount(st.remaining),
						name: this.store.personName(tx.personId)
					}) : t("settleDebtLine", {
						amt: fmt.amount(st.remaining),
						name: this.store.personName(tx.personId)
					}), t("settleNote")],
					confirmLabel: t("settle"),
					onConfirm: () => this.store.settleTransaction(tx.id)
				}).open()
			};
			actions.appendChild(settle)
		}
		const del = el("button", "pa-btn danger", t("delete"));
		del.onclick = () => {
			this.close();
			const doDelete = async () => {
				await this.store.deleteTransaction(tx.id);
				new Notice(t("txDeleted"))
			};
			if (!this.store.confirmDelete) {
				void doDelete();
				return
			}
			new ConfirmModal(this.app, {
				title: t("deleteTxTitle"),
				lines: [this.store.personName(tx.personId), fmt.amount(tx.amount) + " — " + (tx.description || typeLabel(tx.type)), t("deleteTxNote")],
				confirmLabel: t("delete"),
				danger: true,
				onConfirm: doDelete
			}).open()
		};
		actions.appendChild(del)
	}
	onClose() {
		this.contentEl.empty()
	}
}
const CHART_COLORS = ["#4e79a7", "#f28e2c", "#e15759", "#76b7b2", "#59a14f", "#edc949", "#af7aa1", "#ff9da7", "#9c755f", "#bab0ab"];

function svgEl(tag, attrs) {
	const e = document.createElementNS("http://www.w3.org/2000/svg", tag);
	if (attrs)
		for (const k in attrs) e.setAttribute(k, attrs[k]);
	return e
}

function svgText(txt, attrs) {
	const e = svgEl("text", attrs);
	e.textContent = txt;
	return e
}

function svgPath(d, attrs) {
	return svgEl("path", Object.assign({
		d
	}, attrs || {}))
}

function polarToCartesian(cx, cy, r, angleDeg) {
	const rad = (angleDeg - 90) * Math.PI / 180;
	return {
		x: cx + r * Math.cos(rad),
		y: cy + r * Math.sin(rad)
	}
}

function describeArc(cx, cy, r, startAngle, endAngle) {
	const start = polarToCartesian(cx, cy, r, endAngle);
	const end = polarToCartesian(cx, cy, r, startAngle);
	const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
	return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`
}

function fmtShort(n) {
	const abs = Math.abs(n);
	if (abs >= 1e9) return (n / 1e9).toFixed(1) + "B";
	if (abs >= 1e6) return (n / 1e6).toFixed(1) + "M";
	if (abs >= 1e3) return (n / 1e3).toFixed(1) + "K";
	return String(Math.round(n))
}

function renderTrendChart(data, fmt) {
	const wrap = el("div", "pa-chart-wrap");
	const svg = svgEl("svg", {
		viewBox: "0 0 640 240",
		class: "pa-chart"
	});
	const W = 640,
		H = 240,
		PAD = {
			t: 20,
			r: 20,
			b: 30,
			l: 60
		};
	const months = new Map;
	for (const tx of data.transactions) {
		const key = tx.date.slice(0, 7);
		if (!months.has(key)) months.set(key, {
			rec: 0,
			debt: 0
		});
		const m = months.get(key);
		if (tx.type === "receivable") m.rec += tx.amount;
		else if (tx.type === "debt") m.debt += tx.amount
	}
	const keys = [...months.keys()].sort();
	if (!keys.length) {
		wrap.createDiv("pa-empty").setText(t("noTx"));
		return wrap
	}
	let cumRec = 0,
		cumDebt = 0;
	const seriesRec = [],
		seriesDebt = [];
	for (const k of keys) {
		cumRec += months.get(k).rec;
		cumDebt += months.get(k).debt;
		seriesRec.push(cumRec);
		seriesDebt.push(cumDebt)
	}
	const maxVal = Math.max(...seriesRec, ...seriesDebt, 1);
	const innerW = W - PAD.l - PAD.r;
	const innerH = H - PAD.t - PAD.b;
	const xStep = keys.length > 1 ? innerW / (keys.length - 1) : 0;
	const x = i => PAD.l + i * xStep;
	const y = v => PAD.t + innerH - v / maxVal * innerH;
	for (let i = 0; i <= 4; i++) {
		const gy = PAD.t + i * innerH / 4;
		svg.appendChild(svgEl("line", {
			x1: PAD.l,
			x2: W - PAD.r,
			y1: gy,
			y2: gy,
			stroke: "var(--background-modifier-border)",
			"stroke-dasharray": "2 4"
		}));
		const val = maxVal * (1 - i / 4);
		const txt = svgEl("text", {
			x: PAD.l - 6,
			y: gy + 3,
			"text-anchor": "end",
			"font-size": "10",
			fill: "var(--text-muted)"
		});
		txt.textContent = fmt.num(Math.round(val));
		svg.appendChild(txt)
	}
	const line = (series, color, label) => {
		const d = series.map((v, i) => `${i===0?"M":"L"} ${x(i)} ${y(v)}`).join(" ");
		svg.appendChild(svgEl("path", {
			d,
			fill: "none",
			stroke: color,
			"stroke-width": "2",
			"stroke-linejoin": "round"
		}));
		for (let i = 0; i < series.length; i++) {
			const c = svgEl("circle", {
				cx: x(i),
				cy: y(series[i]),
				r: 3.5,
				fill: color,
				stroke: "var(--background-primary)",
				"stroke-width": "1.5"
			});
			const tooltip = `${fmt.date(keys[i]+"-01")} — ${fmt.amount(series[i])}`;
			c.addEventListener("mouseenter", () => showTooltip(c, tooltip, label));
			c.addEventListener("mouseleave", hideTooltip);
			svg.appendChild(c)
		}
	};
	line(seriesRec, "var(--color-green)", t("filterRec"));
	line(seriesDebt, "var(--color-red)", t("filterDebt"));
	for (let i = 0; i < keys.length; i++) {
		if (keys.length > 8 && i % Math.ceil(keys.length / 8) !== 0 && i !== keys.length - 1) continue;
		const txt = svgEl("text", {
			x: x(i),
			y: H - 10,
			"text-anchor": "middle",
			"font-size": "10",
			fill: "var(--text-muted)"
		});
		txt.textContent = keys[i].slice(2);
		svg.appendChild(txt)
	}
	wrap.appendChild(svg);
	const legend = el("div", "pa-chart-legend");
	const item = (color, label) => {
		const w = el("span", "pa-legend-item");
		const dot = el("span", "pa-legend-dot");
		dot.style.background = color;
		w.append(dot, document.createTextNode(label));
		return w
	};
	legend.appendChild(item("var(--color-green)", t("filterRec")));
	legend.appendChild(item("var(--color-red)", t("filterDebt")));
	wrap.appendChild(legend);
	return wrap
}

function renderPieChart(data, fmt) {
	const wrap = el("div", "pa-chart-wrap");
	const svg = svgEl("svg", {
		viewBox: "0 0 320 260",
		class: "pa-chart"
	});
	const byCat = new Map;
	for (const tx of data.transactions) {
		if (tx.type !== "receivable" && tx.type !== "debt") continue;
		const c = tx.category || "—";
		byCat.set(c, (byCat.get(c) || 0) + tx.amount)
	}
	const items = [...byCat.entries()].sort((a, b) => b[1] - a[1]);
	if (!items.length) {
		wrap.createDiv("pa-empty").setText(t("noTx"));
		return wrap
	}
	const total = items.reduce((s, [, v]) => s + v, 0);
	const cx = 130,
		cy = 130,
		r = 90;
	let angle = -Math.PI / 2;
	for (let i = 0; i < items.length; i++) {
		const [cat, val] = items[i];
		const slice = val / total * Math.PI * 2;
		const x1 = cx + r * Math.cos(angle);
		const y1 = cy + r * Math.sin(angle);
		const x2 = cx + r * Math.cos(angle + slice);
		const y2 = cy + r * Math.sin(angle + slice);
		const large = slice > Math.PI ? 1 : 0;
		const color = CHART_COLORS[i % CHART_COLORS.length];
		const path = svgEl("path", {
			d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`,
			fill: color,
			stroke: "var(--background-primary)",
			"stroke-width": "2"
		});
		const pct = (val / total * 100).toFixed(1);
		path.addEventListener("mouseenter", () => showTooltip(path, cat, `${fmt.amount(val)} (${pct}%)`));
		path.addEventListener("mouseleave", hideTooltip);
		svg.appendChild(path);
		angle += slice
	}
	let ly = 30;
	for (let i = 0; i < items.length && i < 10; i++) {
		const [cat, val] = items[i];
		const color = CHART_COLORS[i % CHART_COLORS.length];
		svg.appendChild(svgEl("rect", {
			x: 240,
			y: ly - 8,
			width: 10,
			height: 10,
			rx: 2,
			fill: color
		}));
		const txt = svgEl("text", {
			x: 256,
			y: ly,
			"font-size": "10",
			fill: "var(--text-normal)"
		});
		const pct = (val / total * 100).toFixed(0);
		txt.textContent = `${cat.slice(0,10)} ${pct}%`;
		svg.appendChild(txt);
		ly += 18
	}
	wrap.appendChild(svg);
	return wrap
}

function renderBarChart(data, fmt) {
	const wrap = el("div", "pa-chart-wrap");
	const svg = svgEl("svg", {
		viewBox: "0 0 640 260",
		class: "pa-chart"
	});
	const byPerson = new Map;
	for (const p of data.people) byPerson.set(p.id, {
		name: p.name,
		rec: 0,
		debt: 0
	});
	for (const tx of data.transactions) {
		const b = byPerson.get(tx.personId);
		if (!b) continue;
		if (tx.type === "receivable") b.rec += tx.amount;
		else if (tx.type === "debt") b.debt += tx.amount
	}
	const items = [...byPerson.values()].map(b => ({
		name: b.name,
		net: b.rec - b.debt
	})).filter(x => Math.abs(x.net) > EPS).sort((a, b) => Math.abs(b.net) - Math.abs(a.net)).slice(0, 10);
	if (!items.length) {
		wrap.createDiv("pa-empty").setText(t("noTx"));
		return wrap
	}
	const W = 640,
		H = 260,
		PAD = 40;
	const maxAbs = Math.max(...items.map(i => Math.abs(i.net)), 1);
	const step = (W - PAD * 2) / items.length;
	const BAR_W = Math.min(36, step * .6);
	const mid = H / 2;
	svg.appendChild(svgEl("line", {
		x1: PAD,
		x2: W - PAD,
		y1: mid,
		y2: mid,
		stroke: "var(--background-modifier-border)",
		"stroke-width": "1"
	}));
	for (let i = 0; i < items.length; i++) {
		const it = items[i];
		const cx = PAD + i * step + step / 2;
		const h = Math.abs(it.net) / maxAbs * (H / 2 - PAD);
		const y = it.net >= 0 ? mid - h : mid;
		const color = it.net >= 0 ? "var(--color-green)" : "var(--color-red)";
		const rect = svgEl("rect", {
			x: cx - BAR_W / 2,
			y,
			width: BAR_W,
			height: h,
			fill: color,
			rx: 4
		});
		rect.addEventListener("mouseenter", () => showTooltip(rect, it.name, fmt.amount(Math.abs(it.net))));
		rect.addEventListener("mouseleave", hideTooltip);
		svg.appendChild(rect);
		const txt = svgEl("text", {
			x: cx,
			y: it.net >= 0 ? y - 4 : y + h + 12,
			"text-anchor": "middle",
			"font-size": "10",
			fill: "var(--text-muted)"
		});
		txt.textContent = it.name.slice(0, 8);
		svg.appendChild(txt)
	}
	wrap.appendChild(svg);
	return wrap
}

function renderKpiCards(data, fmt) {
	const wrap = el("div", "pa-kpi-grid");
	const today = todayISO();
	const states = computeTxStates(data, today, 7);
	let totalRec = 0,
		totalReceived = 0,
		totalDebt = 0,
		totalPaid = 0;
	let totalCount = 0,
		totalAmount = 0;
	for (const tx of data.transactions) {
		totalCount++;
		totalAmount += tx.amount;
		if (tx.type === "receivable") totalRec += tx.amount;
		else if (tx.type === "payment_received") totalReceived += tx.amount;
		else if (tx.type === "debt") totalDebt += tx.amount;
		else if (tx.type === "payment_made") totalPaid += tx.amount
	}
	const collectRate = totalRec > 0 ? Math.min(100, totalReceived / totalRec * 100) : 0;
	let settledOriginCount = 0;
	let originCount = 0;
	for (const tx of data.transactions) {
		if (tx.type === "receivable" || tx.type === "debt") {
			originCount++;
			const st = states.get(tx.id);
			if (st && st.status === "settled") settledOriginCount++
		}
	}
	const realSettleRate = originCount > 0 ? settledOriginCount / originCount * 100 : 0;
	const avgTx = totalCount > 0 ? totalAmount / totalCount : 0;
	const thisMonth = today.slice(0, 7);
	const lastMonthDate = new Date;
	lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
	const lastMonth = toISO(lastMonthDate).slice(0, 7);
	let thisVol = 0,
		lastVol = 0;
	for (const tx of data.transactions) {
		if (tx.date.startsWith(thisMonth)) thisVol += tx.amount;
		else if (tx.date.startsWith(lastMonth)) lastVol += tx.amount
	}
	const growth = lastVol > 0 ? (thisVol - lastVol) / lastVol * 100 : 0;
	const card = (label, value, sub, cls) => {
		const c = el("div", "pa-kpi" + (cls ? " " + cls : ""));
		c.createDiv("pa-kpi-label").setText(label);
		c.createDiv("pa-kpi-value").setText(value);
		if (sub) c.createDiv("pa-kpi-sub").setText(sub);
		return c
	};
	const fa = CURRENT.locale === "fa";
	const pct = (n, digits) => localizeDigits(n.toFixed(digits) + "%", fa);
	wrap.appendChild(card(t("chartKpiRec"), pct(collectRate, 0), fmt.amount(totalReceived, false) + " / " + fmt.amount(totalRec, false), collectRate >= 70 ? "good" : collectRate >= 40 ? "warn" : "bad"));
	wrap.appendChild(card(t("chartKpiSettle"), pct(realSettleRate, 0), settledOriginCount + " / " + originCount, realSettleRate >= 70 ? "good" : realSettleRate >= 40 ? "warn" : "bad"));
	wrap.appendChild(card(t("chartKpiAvg"), fmt.amount(avgTx), t("count") + ": " + localizeDigits(String(totalCount), fa)));
	const sign = growth >= 0 ? "+" : "−";
	wrap.appendChild(card(t("chartKpiGrowth"), sign + pct(growth, 1), t("vsLastMonth"), growth >= 0 ? "good" : "bad"));
	return wrap
}

function renderNetTrendChart(data, fmt) {
	const wrap = el("div", "pa-chart-wrap");
	const W = 640,
		H = 240,
		PAD = {
			t: 20,
			r: 20,
			b: 30,
			l: 60
		};
	const months = new Map;
	for (const tx of data.transactions) {
		const key = tx.date.slice(0, 7);
		if (!months.has(key)) months.set(key, {
			rec: 0,
			debt: 0
		});
		const m = months.get(key);
		if (tx.type === "receivable") m.rec += tx.amount;
		else if (tx.type === "payment_received") m.rec -= tx.amount;
		else if (tx.type === "debt") m.debt += tx.amount;
		else if (tx.type === "payment_made") m.debt -= tx.amount
	}
	const keys = [...months.keys()].sort();
	if (!keys.length) {
		wrap.createDiv("pa-empty").setText(t("noData"));
		return wrap
	}
	const nets = keys.map(k => months.get(k).rec - months.get(k).debt);
	const maxAbs = Math.max(...nets.map(Math.abs), 1);
	const innerW = W - PAD.l - PAD.r;
	const innerH = H - PAD.t - PAD.b;
	const xStep = keys.length > 1 ? innerW / (keys.length - 1) : 0;
	const x = i => PAD.l + i * xStep;
	const y = v => PAD.t + innerH / 2 - v / maxAbs * (innerH / 2);
	const svg = svgEl("svg", {
		viewBox: `0 0 ${W} ${H}`,
		class: "pa-chart"
	});
	const zeroY = y(0);
	svg.appendChild(svgEl("line", {
		x1: PAD.l,
		x2: W - PAD.r,
		y1: zeroY,
		y2: zeroY,
		stroke: "var(--background-modifier-border)",
		"stroke-width": "1"
	}));
	for (let i = 0; i <= 4; i++) {
		const gy = PAD.t + i * innerH / 4;
		svg.appendChild(svgEl("line", {
			x1: PAD.l,
			x2: W - PAD.r,
			y1: gy,
			y2: gy,
			stroke: "var(--background-modifier-border)",
			"stroke-dasharray": "2 4",
			opacity: ".4"
		}));
		const val = maxAbs * (1 - i / 2);
		svg.appendChild(svgText(fmtShort(val), {
			x: PAD.l - 6,
			y: gy + 3,
			"text-anchor": "end",
			"font-size": "10",
			fill: "var(--text-muted)"
		}))
	}
	const posPath = [];
	const negPath = [];
	nets.forEach((v, i) => {
		posPath.push(`${i===0?"M":"L"} ${x(i)} ${v>=0?y(v):zeroY}`);
		negPath.push(`${i===0?"M":"L"} ${x(i)} ${v<0?y(v):zeroY}`)
	});
	posPath.push(`L ${x(nets.length-1)} ${zeroY} L ${x(0)} ${zeroY} Z`);
	negPath.push(`L ${x(nets.length-1)} ${zeroY} L ${x(0)} ${zeroY} Z`);
	svg.appendChild(svgPath(posPath.join(" "), {
		fill: "var(--color-green)",
		opacity: ".15"
	}));
	svg.appendChild(svgPath(negPath.join(" "), {
		fill: "var(--color-red)",
		opacity: ".15"
	}));
	const lineD = nets.map((v, i) => `${i===0?"M":"L"} ${x(i)} ${y(v)}`).join(" ");
	svg.appendChild(svgPath(lineD, {
		fill: "none",
		stroke: "var(--interactive-accent)",
		"stroke-width": "2.5",
		"stroke-linejoin": "round"
	}));
	nets.forEach((v, i) => {
		const c = svgEl("circle", {
			cx: x(i),
			cy: y(v),
			r: 4,
			fill: v >= 0 ? "var(--color-green)" : "var(--color-red)",
			stroke: "var(--background-primary)",
			"stroke-width": "2"
		});
		c.addEventListener("mouseenter", () => showTooltip(c, fmt.date(keys[i] + "-01"), fmt.amount(v)));
		c.addEventListener("mouseleave", hideTooltip);
		svg.appendChild(c)
	});
	const step = Math.max(1, Math.ceil(keys.length / 8));
	keys.forEach((k, i) => {
		if (i % step !== 0 && i !== keys.length - 1) return;
		svg.appendChild(svgText(k.slice(2), {
			x: x(i),
			y: H - 10,
			"text-anchor": "middle",
			"font-size": "10",
			fill: "var(--text-muted)"
		}))
	});
	wrap.appendChild(svg);
	return wrap
}

function renderAgingDonut(data, fmt) {
	const wrap = el("div", "pa-chart-wrap");
	const today = todayISO();
	const states = computeTxStates(data, today, 7);
	const buckets = {
		fresh: 0,
		mild: 0,
		old: 0,
		stale: 0
	};
	for (const tx of data.transactions) {
		if (tx.type !== "receivable" && tx.type !== "debt") continue;
		const st = states.get(tx.id);
		if (!st || st.status === "settled") continue;
		const age = diffDays(tx.date, today);
		if (age <= 30) buckets.fresh += st.remaining;
		else if (age <= 90) buckets.mild += st.remaining;
		else if (age <= 180) buckets.old += st.remaining;
		else buckets.stale += st.remaining
	}
	const items = [{
		label: t("ageFresh"),
		value: buckets.fresh,
		color: "#59a14f"
	}, {
		label: t("ageMild"),
		value: buckets.mild,
		color: "#edc949"
	}, {
		label: t("ageOld"),
		value: buckets.old,
		color: "#f28e2c"
	}, {
		label: t("ageStale"),
		value: buckets.stale,
		color: "#e15759"
	}].filter(x => x.value > 0);
	const total = items.reduce((s, x) => s + x.value, 0);
	if (!total) {
		wrap.createDiv("pa-empty").setText(t("noData"));
		return wrap
	}
	const container = el("div", "pa-donut-container");
	const svg = svgEl("svg", {
		viewBox: "0 0 200 200",
		class: "pa-donut"
	});
	const cx = 100,
		cy = 100,
		r = 70,
		stroke = 26;
	let angle = -90;
	for (const item of items) {
		const pct = item.value / total;
		const arc = pct * 360;
		const endAngle = angle + arc;
		const path = svgPath(describeArc(cx, cy, r - stroke / 2, angle, endAngle), {
			fill: "none",
			stroke: item.color,
			"stroke-width": stroke,
			"stroke-linecap": "butt"
		});
		path.addEventListener("mouseenter", () => showTooltip(path, item.label, fmt.amount(item.value) + " (" + (pct * 100).toFixed(1) + "%)"));
		path.addEventListener("mouseleave", hideTooltip);
		svg.appendChild(path);
		angle = endAngle
	}
	svg.appendChild(svgText(fmt.amount(total, false), {
		x: cx,
		y: cy - 4,
		"text-anchor": "middle",
		"font-size": "16",
		"font-weight": "700",
		fill: "var(--text-normal)"
	}));
	svg.appendChild(svgText(fmt.currencyLabel(), {
		x: cx,
		y: cy + 14,
		"text-anchor": "middle",
		"font-size": "10",
		fill: "var(--text-muted)"
	}));
	container.appendChild(svg);
	const legend = el("div", "pa-donut-legend");
	for (const item of items) {
		const row = el("div", "pa-donut-legend-row");
		const dot = el("span", "pa-legend-dot");
		dot.style.background = item.color;
		const label = el("span", "pa-donut-legend-label", item.label);
		const val = el("span", "pa-donut-legend-val", fmt.amount(item.value, false) + " (" + (item.value / total * 100).toFixed(0) + "%)");
		row.append(dot, label, val);
		legend.appendChild(row)
	}
	container.appendChild(legend);
	wrap.appendChild(container);
	return wrap
}

function renderTopBars(data, fmt, mode) {
	const wrap = el("div", "pa-chart-wrap");
	const balances = computeBalances(data);
	const items = [...balances.values()].map(b => ({
		name: b.person.name,
		value: mode === "debtors" ? b.remainingDebt : b.remainingReceivable
	})).filter(x => x.value > EPS).sort((a, b) => b.value - a.value).slice(0, 8);
	if (!items.length) {
		wrap.createDiv("pa-empty").setText(t("noData"));
		return wrap
	}
	const max = Math.max(...items.map(x => x.value));
	const color = mode === "debtors" ? "var(--color-red)" : "var(--color-green)";
	const list = el("div", "pa-hbar-list");
	for (const item of items) {
		const row = el("div", "pa-hbar-row");
		const name = el("div", "pa-hbar-name", item.name);
		const barWrap = el("div", "pa-hbar-track");
		const bar = el("div", "pa-hbar-fill");
		bar.style.width = item.value / max * 100 + "%";
		bar.style.background = color;
		barWrap.appendChild(bar);
		const val = el("div", "pa-hbar-value", fmt.amount(item.value, false));
		row.append(name, barWrap, val);
		list.appendChild(row)
	}
	wrap.appendChild(list);
	return wrap
}

function renderHeatmap(data, fmt) {
	const wrap = el("div", "pa-chart-wrap");
	const weeks = 26;
	const days = 7;
	const cells = new Map;
	const today = new Date;
	const start = new Date(today);
	start.setDate(start.getDate() - weeks * 7);
	let maxCount = 0;
	for (const tx of data.transactions) {
		const d = parseISO(tx.date);
		if (d === null) continue;
		const dDate = new Date(d);
		if (dDate < start) continue;
		const dayIdx = dDate.getUTCDay();
		const weekIdx = Math.floor((dDate - start) / (7 * 864e5));
		const key = weekIdx + "|" + dayIdx;
		const cur = cells.get(key) || 0;
		cells.set(key, cur + 1);
		if (cur + 1 > maxCount) maxCount = cur + 1
	}
	if (maxCount === 0) {
		wrap.createDiv("pa-empty").setText(t("noData"));
		return wrap
	}
	const svg = svgEl("svg", {
		viewBox: `0 0 ${weeks*14+40} 130`,
		class: "pa-chart"
	});
	const cellSize = 12,
		gap = 2;
	const wdLabels = CURRENT.locale === "fa" ? ["ی", "د", "س", "چ", "پ", "ج", "ش"] : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
	for (let d = 0; d < days; d++) {
		svg.appendChild(svgText(wdLabels[d], {
			x: 4,
			y: 22 + d * (cellSize + gap) + cellSize / 2 + 4,
			"font-size": "9",
			fill: "var(--text-muted)"
		}))
	}
	for (let w = 0; w < weeks; w++) {
		for (let d = 0; d < days; d++) {
			const count = cells.get(w + "|" + d) || 0;
			const intensity = maxCount > 0 ? count / maxCount : 0;
			const x = 30 + w * (cellSize + gap);
			const y = 22 + d * (cellSize + gap);
			const opacity = count === 0 ? .06 : .2 + intensity * .8;
			const rect = svgEl("rect", {
				x,
				y,
				width: cellSize,
				height: cellSize,
				rx: 2,
				fill: "var(--interactive-accent)",
				opacity
			});
			if (count > 0) {
				rect.addEventListener("mouseenter", () => showTooltip(rect, count + " " + t("count"), ""));
				rect.addEventListener("mouseleave", hideTooltip)
			}
			svg.appendChild(rect)
		}
	}
	wrap.appendChild(svg);
	return wrap
}

function renderRadarChart(data, fmt) {
	const wrap = el("div", "pa-chart-wrap");
	const byCat = new Map;
	for (const tx of data.transactions) {
		if (tx.type !== "receivable" && tx.type !== "debt") continue;
		const cat = tx.category || (CURRENT.locale === "fa" ? "بدون دسته" : "Uncategorized");
		byCat.set(cat, (byCat.get(cat) || 0) + tx.amount)
	}
	const items = [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
	if (items.length < 3) {
		wrap.createDiv("pa-empty").setText(t("noData"));
		return wrap
	}
	const W = 380,
		H = 320,
		cx = 190,
		cy = 160,
		r = 110;
	const N = items.length;
	const max = Math.max(...items.map(x => x[1]));
	const svg = svgEl("svg", {
		viewBox: `0 0 ${W} ${H}`,
		class: "pa-chart"
	});
	for (let ring = 1; ring <= 4; ring++) {
		const rr = ring / 4 * r;
		const points = [];
		for (let i = 0; i < N; i++) {
			const angle = i / N * 360 - 90;
			const p = polarToCartesian(cx, cy, rr, angle);
			points.push(`${p.x},${p.y}`)
		}
		svg.appendChild(svgEl("polygon", {
			points: points.join(" "),
			fill: "none",
			stroke: "var(--background-modifier-border)",
			"stroke-width": "1"
		}))
	}
	for (let i = 0; i < N; i++) {
		const angle = i / N * 360 - 90;
		const p = polarToCartesian(cx, cy, r, angle);
		svg.appendChild(svgEl("line", {
			x1: cx,
			y1: cy,
			x2: p.x,
			y2: p.y,
			stroke: "var(--background-modifier-border)",
			"stroke-width": "1"
		}));
		const lbl = polarToCartesian(cx, cy, r + 22, angle);
		svg.appendChild(svgText(items[i][0].slice(0, 12), {
			x: lbl.x,
			y: lbl.y + 4,
			"text-anchor": "middle",
			"font-size": "10",
			fill: "var(--text-muted)"
		}))
	}
	const points = [];
	for (let i = 0; i < N; i++) {
		const angle = i / N * 360 - 90;
		const val = items[i][1] / max;
		const p = polarToCartesian(cx, cy, r * val, angle);
		points.push(`${p.x},${p.y}`)
	}
	svg.appendChild(svgEl("polygon", {
		points: points.join(" "),
		fill: "var(--interactive-accent)",
		"fill-opacity": ".25",
		stroke: "var(--interactive-accent)",
		"stroke-width": "2"
	}));
	points.forEach((pt, i) => {
		const [x, y] = pt.split(",").map(Number);
		const c = svgEl("circle", {
			cx: x,
			cy: y,
			r: 4,
			fill: "var(--interactive-accent)"
		});
		c.addEventListener("mouseenter", () => showTooltip(c, items[i][0], fmt.amount(items[i][1])));
		c.addEventListener("mouseleave", hideTooltip);
		svg.appendChild(c)
	});
	wrap.appendChild(svg);
	return wrap
}

function renderWaterfallChart(data, fmt) {
	const wrap = el("div", "pa-chart-wrap");
	const months = new Map;
	for (const tx of data.transactions) {
		const key = tx.date.slice(0, 7);
		if (!months.has(key)) months.set(key, {
			inflow: 0,
			outflow: 0
		});
		const m = months.get(key);
		if (tx.type === "receivable") m.inflow += tx.amount;
		else if (tx.type === "payment_received") m.outflow += tx.amount
	}
	const keys = [...months.keys()].sort();
	if (!keys.length) {
		wrap.createDiv("pa-empty").setText(t("noData"));
		return wrap
	}
	const W = 640,
		H = 260,
		PAD = {
			t: 20,
			r: 20,
			b: 30,
			l: 60
		};
	const innerW = W - PAD.l - PAD.r;
	const innerH = H - PAD.t - PAD.b;
	let running = 0;
	const cumulatives = [];
	for (const k of keys) {
		running += months.get(k).inflow - months.get(k).outflow;
		cumulatives.push(running)
	}
	const maxAbs = Math.max(...cumulatives.map(Math.abs), 1);
	const xStep = keys.length > 1 ? innerW / (keys.length - 1) : 0;
	const x = i => PAD.l + i * xStep;
	const zeroY = PAD.t + innerH / 2;
	const y = v => zeroY - v / maxAbs * (innerH / 2);
	const svg = svgEl("svg", {
		viewBox: `0 0 ${W} ${H}`,
		class: "pa-chart"
	});
	svg.appendChild(svgEl("line", {
		x1: PAD.l,
		x2: W - PAD.r,
		y1: zeroY,
		y2: zeroY,
		stroke: "var(--background-modifier-border)"
	}));
	cumulatives.forEach((v, i) => {
		const yTop = v >= 0 ? y(v) : zeroY;
		const h = Math.abs(y(v) - zeroY);
		const barW = Math.min(40, xStep * .7);
		const rect = svgEl("rect", {
			x: x(i) - barW / 2,
			y: yTop,
			width: barW,
			height: h,
			fill: v >= 0 ? "var(--color-green)" : "var(--color-red)",
			rx: 3,
			opacity: ".85"
		});
		rect.addEventListener("mouseenter", () => showTooltip(rect, fmt.date(keys[i] + "-01"), fmt.amount(v)));
		rect.addEventListener("mouseleave", hideTooltip);
		svg.appendChild(rect);
		if (i < cumulatives.length - 1) {
			svg.appendChild(svgEl("line", {
				x1: x(i) + barW / 2,
				y1: v >= 0 ? y(v) : zeroY,
				x2: x(i + 1) - barW / 2,
				y2: cumulatives[i + 1] >= 0 ? y(cumulatives[i + 1]) : zeroY,
				stroke: "var(--text-muted)",
				"stroke-width": "1",
				"stroke-dasharray": "3 3"
			}))
		}
	});
	const step = Math.max(1, Math.ceil(keys.length / 8));
	keys.forEach((k, i) => {
		if (i % step !== 0 && i !== keys.length - 1) return;
		svg.appendChild(svgText(k.slice(2), {
			x: x(i),
			y: H - 10,
			"text-anchor": "middle",
			"font-size": "10",
			fill: "var(--text-muted)"
		}))
	});
	wrap.appendChild(svg);
	return wrap
}

function renderPaymentSpeedGauge(data, fmt) {
	const wrap = el("div", "pa-chart-wrap");
	const origins = new Map(data.transactions.filter(t => t.type === "receivable" || t.type === "debt").map(t => [t.id, t]));
	const payments = data.transactions.filter(t => t.type === "payment_received" || t.type === "payment_made");
	const speeds = [];
	for (const p of payments) {
		if (!p.linkedTo) continue;
		const origin = origins.get(p.linkedTo);
		if (!origin) continue;
		const d = diffDays(origin.date, p.date);
		if (d >= 0) speeds.push(d)
	}
	const avg = speeds.length ? speeds.reduce((s, x) => s + x, 0) / speeds.length : 0;
	const W = 300,
		H = 200,
		cx = 150,
		cy = 150,
		r = 100;
	const svg = svgEl("svg", {
		viewBox: `0 0 ${W} ${H}`,
		class: "pa-chart"
	});
	const arc = (start, end, color, width) => {
		const startP = polarToCartesian(cx, cy, r - width / 2, start);
		const endP = polarToCartesian(cx, cy, r - width / 2, end);
		const largeArc = end - start <= 180 ? 0 : 1;
		return svgPath(`M ${startP.x} ${startP.y} A ${r-width/2} ${r-width/2} 0 ${largeArc} 1 ${endP.x} ${endP.y}`, {
			fill: "none",
			stroke: color,
			"stroke-width": width,
			"stroke-linecap": "round"
		})
	};
	svg.appendChild(arc(-90, 90, "var(--background-modifier-border)", 20));
	const speedRatio = Math.min(1, avg / 90);
	const endAngle = -90 + speedRatio * 180;
	const color = avg < 15 ? "var(--color-green)" : avg < 45 ? "var(--color-yellow)" : "var(--color-red)";
	if (avg > 0) {
		svg.appendChild(arc(-90, endAngle, color, 20))
	}
	const needle = polarToCartesian(cx, cy, r - 30, endAngle);
	svg.appendChild(svgEl("line", {
		x1: cx,
		y1: cy,
		x2: needle.x,
		y2: needle.y,
		stroke: "var(--text-normal)",
		"stroke-width": "3",
		"stroke-linecap": "round"
	}));
	svg.appendChild(svgEl("circle", {
		cx,
		cy,
		r: 6,
		fill: "var(--text-normal)"
	}));
	svg.appendChild(svgText(fmt.num(Math.round(avg)), {
		x: cx,
		y: cy + 40,
		"text-anchor": "middle",
		"font-size": "24",
		"font-weight": "700",
		fill: color
	}));
	svg.appendChild(svgText(t("days"), {
		x: cx,
		y: cy + 60,
		"text-anchor": "middle",
		"font-size": "11",
		fill: "var(--text-muted)"
	}));
	wrap.appendChild(svg);
	if (!speeds.length) {
		wrap.createDiv("pa-empty").setText(t("noData"))
	}
	return wrap
}

function renderCategoryCompare(data, fmt) {
	const wrap = el("div", "pa-chart-wrap");
	const byCat = new Map;
	for (const tx of data.transactions) {
		if (tx.type !== "receivable" && tx.type !== "debt") continue;
		const cat = tx.category || "—";
		if (!byCat.has(cat)) byCat.set(cat, {
			rec: 0,
			debt: 0
		});
		const c = byCat.get(cat);
		if (tx.type === "receivable") c.rec += tx.amount;
		else c.debt += tx.amount
	}
	const items = [...byCat.entries()].sort((a, b) => b[1].rec + b[1].debt - (a[1].rec + a[1].debt)).slice(0, 8);
	if (!items.length) {
		wrap.createDiv("pa-empty").setText(t("noData"));
		return wrap
	}
	const W = 640,
		H = 260,
		PAD = {
			t: 20,
			r: 20,
			b: 50,
			l: 60
		};
	const innerW = W - PAD.l - PAD.r;
	const innerH = H - PAD.t - PAD.b;
	const max = Math.max(...items.map(x => x[1].rec + x[1].debt), 1);
	const svg = svgEl("svg", {
		viewBox: `0 0 ${W} ${H}`,
		class: "pa-chart"
	});
	for (let i = 0; i <= 4; i++) {
		const gy = PAD.t + i * innerH / 4;
		svg.appendChild(svgEl("line", {
			x1: PAD.l,
			x2: W - PAD.r,
			y1: gy,
			y2: gy,
			stroke: "var(--background-modifier-border)",
			"stroke-dasharray": "2 4",
			opacity: ".4"
		}));
		svg.appendChild(svgText(fmtShort(max * (1 - i / 4)), {
			x: PAD.l - 6,
			y: gy + 3,
			"text-anchor": "end",
			"font-size": "10",
			fill: "var(--text-muted)"
		}))
	}
	const step = innerW / items.length;
	const barW = Math.min(46, step * .6);
	items.forEach(([cat, vals], i) => {
		const cx = PAD.l + i * step + step / 2;
		const total = vals.rec + vals.debt;
		const totalH = total / max * innerH;
		const recH = vals.rec / total * totalH;
		const debtH = vals.debt / total * totalH;
		const yTop = PAD.t + innerH - totalH;
		const recRect = svgEl("rect", {
			x: cx - barW / 2,
			y: PAD.t + innerH - recH,
			width: barW,
			height: recH,
			fill: "var(--color-green)"
		});
		recRect.addEventListener("mouseenter", () => showTooltip(recRect, cat, t("receivable") + ": " + fmt.amount(vals.rec)));
		recRect.addEventListener("mouseleave", hideTooltip);
		svg.appendChild(recRect);
		const debtRect = svgEl("rect", {
			x: cx - barW / 2,
			y: yTop,
			width: barW,
			height: debtH,
			fill: "var(--color-red)",
			rx: "3 3 0 0"
		});
		debtRect.addEventListener("mouseenter", () => showTooltip(debtRect, cat, t("debt") + ": " + fmt.amount(vals.debt)));
		debtRect.addEventListener("mouseleave", hideTooltip);
		svg.appendChild(debtRect);
		svg.appendChild(svgText(cat.slice(0, 10), {
			x: cx,
			y: H - 20,
			"text-anchor": "middle",
			"font-size": "10",
			fill: "var(--text-muted)"
		}))
	});
	wrap.appendChild(svg);
	const legend = el("div", "pa-chart-legend");
	const mkItem = (color, label) => {
		const w = el("span", "pa-legend-item");
		const dot = el("span", "pa-legend-dot");
		dot.style.background = color;
		w.append(dot, document.createTextNode(label));
		return w
	};
	legend.appendChild(mkItem("var(--color-green)", t("filterRec")));
	legend.appendChild(mkItem("var(--color-red)", t("filterDebt")));
	wrap.appendChild(legend);
	return wrap
}
const FILTERS = [
	["all", "filterAll"],
	["receivables", "filterRec"],
	["debts", "filterDebt"],
	["settled", "filterSettled"],
	["unsettled", "filterUnsettled"],
	["overdue", "filterOverdue"],
	["due-soon", "filterDueSoon"]
];
const SORTS = [
	["newest", "sortNewest"],
	["oldest", "sortOldest"],
	["highest", "sortHighest"],
	["lowest", "sortLowest"],
	["due", "sortDue"]
];
class AccountsView extends ItemView {
	constructor(leaf, plugin) {
		super(leaf);
		this.plugin = plugin;
		this.navigation = true;
		this.nav = {
			screen: "dashboard",
			personId: null,
			search: "",
			filter: "all",
			sort: "newest",
			analyticsTab: "charts",
			categoryFilter: ""
		};
		this.unsub = null
	}
	getViewType() {
		return VIEW_TYPE_PERSONAL_ACCOUNTS
	}
	getDisplayText() {
		return t("appTitle")
	}
	getIcon() {
		return "wallet"
	}
	async onOpen() {
		this.contentEl.addClass("pa-view");
		this.unsub = this.plugin.accounts.subscribe(() => this.render());
		await this.plugin.accounts.reload();
		this.render()
	}
	async onClose() {
		if (this.unsub) this.unsub()
	}
	navigate(patch) {
		Object.assign(this.nav, patch);
		this.render()
	}
	render() {
		const root = this.contentEl;
		root.empty();
		root.toggleClass("pa-compact", this.plugin.settings.compact);
		root.toggleClass("pa-rtl", CURRENT.locale === "fa");
		const store = this.plugin.accounts;
		const header = root.createDiv("pa-header");
		header.createDiv("pa-title").setText(t("appTitle"));
		const tabs = header.createDiv("pa-tabs");
		const mkTab = (label, screen, tipKey) => {
			const active = this.nav.screen === screen || screen === "people" && this.nav.screen === "person";
			const tab = el("div", "pa-tab" + (active ? " active" : ""), label);
			tab.onclick = () => this.navigate({
				screen
			});
			if (tipKey) attachTooltip(tab, t(tipKey), null, {
				both: true
			});
			tabs.appendChild(tab)
		};
		mkTab(t("tabDashboard"), "dashboard", "tipDashboard");
		mkTab(t("tabPeople"), "people", "tipPeople");
		mkTab(t("tabTransactions"), "transactions", "tipTransactions");
		mkTab(t("tabAnalytics"), "analytics", "tipAnalytics");
		const addBtn = el("button", "pa-btn primary", t("addTx"));
		addBtn.onclick = () => new TransactionFormModal(this.app, store, null, {}).open();
		attachTooltip(addBtn, t("tipAddTx"), null, {
			both: true
		});
		header.appendChild(addBtn);
		header.appendChild(iconButton("file-text", t("openNote"), async () => {
			try {
				const path = normalizePath((this.plugin.settings.filePath || "").trim() || DEFAULT_FILE_PATH);
				let file = this.app.vault.getAbstractFileByPath(path);
				if (!(file instanceof TFile)) {
					await this.plugin.repo.save(store.data);
					file = this.app.vault.getAbstractFileByPath(path)
				}
				if (file instanceof TFile) await this.app.workspace.getLeaf("tab").openFile(file)
			} catch (e) {
				new Notice(String(e instanceof Error ? e.message : e))
			}
		}, "tipOpenNote"));
		header.appendChild(iconButton("refresh-cw", t("reload"), () => {
			void store.reload()
		}, "tipReload"));
		const body = root.createDiv("pa-body");
		if (store.error) {
			this.renderError(body);
			return
		}
		switch (this.nav.screen) {
			case "dashboard":
				this.renderDashboard(body);
				break;
			case "people":
				this.renderPeople(body);
				break;
			case "person":
				this.renderPerson(body);
				break;
			case "transactions":
				this.renderTransactions(body);
				break;
			case "analytics":
				this.renderAnalytics(body);
				break
		}
	}
	renderError(body) {
		const store = this.plugin.accounts;
		const card = body.createDiv("pa-card pa-error");
		card.createDiv("pa-card-title").setText(t("dataProblem"));
		card.createDiv("pa-muted").setText(store.error || t("unknownError"));
		const actions = card.createDiv("pa-actions");
		const retry = el("button", "pa-btn", t("retry"));
		retry.onclick = () => {
			void store.reload()
		};
		actions.appendChild(retry)
	}
	dueChipFor(tx) {
		const st = this.plugin.accounts.ledger ? this.plugin.accounts.ledger.states.get(tx.id) : null;
		if (!st || !st.due) return null;
		return dueChip(st.due, this.plugin.accounts.fmt.date(tx.dueDate))
	}
	cardTitle(card, textKey, helpKey) {
		const title = card.createDiv("pa-card-title");
		title.setText(t(textKey));
		if (helpKey) title.appendChild(helpIcon(this.app, helpKey));
		return title
	}
	txRow(tx, showPerson) {
		const store = this.plugin.accounts;
		const fmt = store.fmt;
		const st = store.ledger ? store.ledger.states.get(tx.id) : null;
		const row = el("div", "pa-row");
		const main = row.createDiv("pa-row-main");
		const title = tx.description || typeLabel(tx.type);
		main.createDiv("pa-row-title").setText(showPerson ? store.personName(tx.personId) + " — " + title : title);
		const sub = main.createDiv("pa-row-sub");
		sub.appendChild(el("span", "pa-chip", typeLabel(tx.type)));
		if (tx.category) sub.appendChild(el("span", "pa-chip", tx.category));
		const chip = this.dueChipFor(tx);
		if (chip) sub.appendChild(chip);
		if (st && st.status === "partial") {
			sub.appendChild(el("span", "pa-money dim", t("remainingLabel") + " " + fmt.amount(st.remaining)))
		}
		if (st && st.status === "settled") {
			sub.appendChild(el("span", "pa-chip settled", t("settled")))
		}
		const positive = tx.type === "receivable" || tx.type === "payment_made";
		const amt = row.createDiv("pa-row-amt pa-money " + (positive ? "pos" : "neg"));
		amt.setText((positive ? "+" : "−") + fmt.amount(tx.amount, false));
		attachTooltip(amt, fmt.amount(tx.amount), fmt.date(tx.date));
		attachTooltip(row, t("tipTxRow"), title, {
			both: true,
			delay: 500
		});
		row.onclick = () => new TransactionDetailModal(this.app, store, tx, {}).open();
		return row
	}
	personRow(b) {
		const fmt = this.plugin.accounts.fmt;
		const row = el("div", "pa-row");
		const main = row.createDiv("pa-row-main");
		main.createDiv("pa-row-title").setText(b.person.name);
		if (b.person.tags && b.person.tags.length) {
			const sub = main.createDiv("pa-row-sub");
			for (const tag of b.person.tags) sub.appendChild(el("span", "pa-chip", tag))
		}
		const wrap = row.createDiv("pa-row-amt");
		if (Math.abs(b.net) <= EPS) {
			if (b.txCount > 0) wrap.appendChild(el("span", "pa-chip settled", t("settled")));
			else wrap.appendChild(el("span", "pa-money dim", t("noBalance")))
		} else {
			const pos = b.net > 0;
			wrap.appendChild(el("div", "pa-money " + (pos ? "pos" : "neg"), fmt.amount(Math.abs(b.net))));
			wrap.createDiv("pa-row-sub").setText(pos ? t("receivable") : t("debt"))
		}
		attachTooltip(row, t("tipOpenPerson"), b.person.name, {
			both: true,
			delay: 500
		});
		row.onclick = () => this.openPerson(b.person.id);
		return row
	}
	attentionRow(item) {
		const fmt = this.plugin.accounts.fmt;
		const row = el("div", "pa-row");
		const main = row.createDiv("pa-row-main");
		main.createDiv("pa-row-title").setText(item.personName + " — " + fmt.amount(item.remaining));
		const sub = main.createDiv("pa-row-sub");
		sub.createSpan().setText(item.tx.description || typeLabel(item.tx.type));
		sub.appendChild(dueChip(item.due, fmt.date(item.tx.dueDate)));
		row.onclick = () => this.openPerson(item.tx.personId);
		return row
	}
	/* ✅ FIX: stat با پشتیبانی از آیکون (برای آمار ثانویه در موبایل) */
	stat(parent, label, value, accent, tipKey, extraCls, iconName) {
		const d = parent.createDiv("pa-stat" + (accent ? " " + accent : "") + (extraCls ? " " + extraCls : ""));
		const labelRow = d.createDiv("pa-stat-label");
		if (iconName) {
			const iconWrap = labelRow.createSpan("pa-stat-icon");
			setIcon(iconWrap, iconName);
			const text = labelRow.createSpan("pa-stat-label-text");
			text.setText(label)
		} else {
			labelRow.setText(label)
		}
		d.createDiv("pa-stat-value").setText(value);
		if (tipKey) attachTooltip(d, t(tipKey), label, {
			both: true
		});
		return d
	}
	openPerson(personId) {
		this.navigate({
			screen: "person",
			personId
		})
	}
	renderDashboard(body) {
		const store = this.plugin.accounts;
		const fmt = store.fmt;
		const L = store.ledger;
		const s = L.stats;
		const tIso = todayISO();
		const tWd = isoWeekday(tIso);
		const tDate = calDateFromISO(tIso, this.plugin.settings.calendar);
		const evs = tDate ? Cal.eventsOf(tDate) : [];
		body.createDiv("pa-todayline").setText(fmt.date(tIso) + (tWd === null ? "" : " · " + Cal.weekdayName(tWd)) + (evs.length ? "  •  " + evs.slice(0, 2).join(" • ") : ""));
		const fa = CURRENT.locale === "fa";
		const faNum = n => localizeDigits(String(n), fa);
		const primary = body.createDiv("pa-stats-primary");
		this.stat(primary, t("statTotalRec"), fmt.amount(s.totalReceivables), "accent-rec", "tipStatRec");
		this.stat(primary, t("statTotalDebt"), fmt.amount(s.totalDebts), "accent-debt", "tipStatDebt");
		this.stat(primary, t("statNet"), fmt.amount(s.net), "accent-net", "tipStatNet");
		const secondary = body.createDiv("pa-stats-secondary");
		/* ✅ FIX: آیکون برای آمار ثانویه — در موبایل فقط آیکون دیده می‌شود */
		this.stat(secondary, t("statPeople"), faNum(s.peopleCount), null, "tipStatPeople", null, "users");
		this.stat(secondary, t("statUnsettled"), faNum(s.unpaidCount), null, "tipStatUnsettled", null, "circle-dot");
		this.stat(secondary, t("statSettled"), faNum(s.settledCount), null, "tipStatSettled", null, "check-circle-2");
		this.stat(secondary, t("statOverdue"), faNum(s.overdueCount), s.overdueCount > 0 ? "danger" : null, "tipStatOverdue", null, "alert-triangle");
		this.stat(secondary, t("statDueSoon"), faNum(s.dueSoonCount), s.dueSoonCount > 0 ? "warn" : null, "tipStatDueSoon", null, "clock");
		if (s.peopleCount === 0) {
			const c = body.createDiv("pa-card");
			c.createDiv("pa-empty").setText(t("getStarted"));
			return
		}
		const upc = body.createDiv("pa-card");
		upc.createDiv("pa-card-title").setText(t("upcoming"));
		if (!L.attention.length) {
			upc.createDiv("pa-empty").setText(t("nothingDue"))
		} else {
			const list = upc.createDiv("pa-scroll");
			for (const item of L.attention.slice(0, 10)) list.appendChild(this.attentionRow(item))
		}
		const pc = body.createDiv("pa-card");
		const title = pc.createDiv("pa-card-title");
		title.setText(t("peopleCard"));
		const all = el("a", "pa-link", t("viewAll"));
		all.onclick = () => this.navigate({
			screen: "people"
		});
		title.appendChild(all);
		const balances = [...L.balances.values()].filter(b => b.txCount > 0).sort((a, b) => Math.abs(b.net) - Math.abs(a.net) || a.person.name.localeCompare(b.person.name));
		const rows = pc.createDiv("pa-scroll");
		for (const b of balances.slice(0, 10)) rows.appendChild(this.personRow(b))
	}
	renderPeople(body) {
		const store = this.plugin.accounts;
		const L = store.ledger;
		const bar = body.createDiv("pa-toolbar");
		const search = el("input");
		search.type = "search";
		search.placeholder = t("searchPeople");
		search.value = this.nav.search;
		attachTooltip(search, t("tipSearchPeople"), null, {
			both: true,
			delay: 700
		});
		bar.appendChild(search);
		const add = el("button", "pa-btn primary", t("addPersonBtn"));
		add.onclick = () => new PersonModal(this.app, store, null, {}).open();
		attachTooltip(add, t("tipAddPerson"), null, {
			both: true
		});
		bar.appendChild(add);
		const listWrap = body.createDiv("pa-card");
		const renderList = () => {
			listWrap.empty();
			const q = this.nav.search.trim().toLowerCase();
			let people = [...store.data.people].sort((a, b) => {
				const ba = L.balances.get(a.id),
					bb = L.balances.get(b.id);
				const na = ba ? Math.abs(ba.net) : 0,
					nb = bb ? Math.abs(bb.net) : 0;
				return nb - na || a.name.localeCompare(b.name)
			});
			if (q) {
				people = people.filter(p => {
					if (p.name.toLowerCase().includes(q)) return true;
					if (p.phone && p.phone.toLowerCase().includes(q)) return true;
					if (p.email && p.email.toLowerCase().includes(q)) return true;
					if (p.tags && p.tags.some(x => x.toLowerCase().includes(q))) return true;
					if (p.note && p.note.toLowerCase().includes(q)) return true;
					return false
				})
			}
			if (!people.length) {
				listWrap.createDiv("pa-empty").setText(t("noPeople"));
				return
			}
			for (const p of people) {
				const b = L.balances.get(p.id);
				const row = this.personRow(b || {
					person: p,
					net: 0,
					txCount: 0,
					remainingReceivable: 0,
					remainingDebt: 0
				});
				row.appendChild(iconButton("pencil", t("edit"), e => {
					e.stopPropagation();
					new PersonModal(this.app, store, p, {}).open()
				}, "tipEditPerson"));
				row.appendChild(iconButton("trash-2", t("delete"), e => {
					e.stopPropagation();
					this.confirmDeletePerson(p.id, p.name)
				}, "tipDeletePerson"));
				listWrap.appendChild(row)
			}
		};
		search.oninput = () => {
			this.nav.search = search.value;
			renderList()
		};
		renderList()
	}
	confirmDeletePerson(id, name) {
		const store = this.plugin.accounts;
		const doDelete = async () => {
			await store.deletePerson(id);
			if (this.nav.personId === id) this.navigate({
				screen: "people"
			})
		};
		if (!store.confirmDelete) {
			void doDelete();
			return
		}
		new ConfirmModal(this.app, {
			title: t("deletePersonTitle"),
			lines: [t("deletePersonLine", {
				name
			}), t("deleteTxNote")],
			confirmLabel: t("delete"),
			danger: true,
			onConfirm: doDelete
		}).open()
	}
	renderPerson(body) {
		const store = this.plugin.accounts;
		const fmt = store.fmt;
		const L = store.ledger;
		const person = store.data.people.find(p => p.id === this.nav.personId);
		if (!person) {
			body.createDiv("pa-empty").setText(t("noPeople"));
			return
		}
		const b = L.balances.get(person.id) || {
			person,
			net: 0,
			txCount: 0,
			remainingReceivable: 0,
			remainingDebt: 0
		};
		const back = el("button", "pa-btn small", t("back"));
		back.onclick = () => this.navigate({
			screen: "people"
		});
		body.appendChild(back);
		const card = body.createDiv("pa-card");
		const head = card.createDiv("pa-person-head");
		const nameEl = head.createDiv("pa-row-title");
		nameEl.setText(person.name);
		nameEl.style.fontSize = "1.15em";
		head.appendChild(iconButton("pencil", t("edit"), () => new PersonModal(this.app, store, person, {}).open(), "tipEditPerson"));
		const info = card.createDiv("pa-person-info");
		if (person.phone) {
			const r = info.createDiv("pa-info-row");
			r.createSpan({
				cls: "pa-info-key"
			}).setText(t("fPhone") + ": ");
			r.createSpan().setText(person.phone)
		}
		if (person.email) {
			const r = info.createDiv("pa-info-row");
			r.createSpan({
				cls: "pa-info-key"
			}).setText(t("fEmail") + ": ");
			r.createSpan().setText(person.email)
		}
		if (person.tags && person.tags.length) {
			const r = info.createDiv("pa-info-row pa-tags");
			r.createSpan({
				cls: "pa-info-key"
			}).setText(t("fTags") + ": ");
			for (const tag of person.tags) r.appendChild(el("span", "pa-tag", tag))
		}
		if (person.note) {
			info.createDiv("pa-note").setText(person.note)
		}
		const tiles = card.createDiv("pa-tiles");
		this.stat(tiles, t("recRemaining"), fmt.amount(b.remainingReceivable), "accent-rec", "tipStatRec");
		this.stat(tiles, t("debtRemaining"), fmt.amount(b.remainingDebt), "accent-debt", "tipStatDebt");
		const netWord = b.net > EPS ? " " + t("receivable") : b.net < -EPS ? " " + t("debt") : "";
		this.stat(tiles, t("net"), fmt.amount(b.net) + netWord, "accent-net", "tipStatNet");
		const actions = body.createDiv("pa-actions");
		const btn = (label, fn, cls, tipKey) => {
			const x = el("button", "pa-btn " + (cls || ""), label);
			x.onclick = fn;
			if (tipKey) attachTooltip(x, t(tipKey), null, {
				both: true
			});
			actions.appendChild(x)
		};
		btn(t("addRec"), () => new TransactionFormModal(this.app, store, null, {
			preset: {
				personId: person.id,
				type: "receivable",
				lockPerson: true
			}
		}).open(), "", "tipAddRec");
		btn(t("addDebt"), () => new TransactionFormModal(this.app, store, null, {
			preset: {
				personId: person.id,
				type: "debt",
				lockPerson: true
			}
		}).open(), "", "tipAddDebt");
		btn(t("recordPayment"), () => {
			const bb = store.ledger.balances.get(person.id);
			const type = bb.remainingReceivable > EPS ? "payment_received" : "payment_made";
			const amount = bb.remainingReceivable > EPS ? bb.remainingReceivable : bb.remainingDebt > EPS ? bb.remainingDebt : undefined;
			new TransactionFormModal(this.app, store, null, {
				preset: {
					personId: person.id,
					type,
					amount,
					lockPerson: true,
					paymentOnly: true
				}
			}).open()
		}, "", "tipRecordPayment");
		if (b.remainingReceivable > EPS || b.remainingDebt > EPS) {
			btn(t("settleAccount"), () => {
				const bb = store.ledger.balances.get(person.id);
				const lines = [];
				if (bb.remainingReceivable > EPS) {
					lines.push(t("settleRecLine", {
						amt: fmt.amount(bb.remainingReceivable),
						name: person.name
					}))
				}
				if (bb.remainingDebt > EPS) {
					lines.push(t("settleDebtLine", {
						amt: fmt.amount(bb.remainingDebt),
						name: person.name
					}))
				}
				new ConfirmModal(this.app, {
					title: t("settleAccount"),
					lines: [...lines, t("settleNote")],
					confirmLabel: t("settle"),
					onConfirm: () => store.settlePerson(person.id)
				}).open()
			}, "primary", "tipSettle")
		}
		btn(t("deletePersonBtn"), () => this.confirmDeletePerson(person.id, person.name), "danger", "tipDeletePerson");
		const hist = body.createDiv("pa-card");
		hist.createDiv("pa-card-title").setText(t("history"));
		const txs = store.data.transactions.filter(tx => tx.personId === person.id).sort((a, z) => z.date.localeCompare(a.date) || z.createdAt - a.createdAt);
		if (!txs.length) {
			hist.createDiv("pa-empty").setText(t("noTx"))
		} else {
			let lastDate = "";
			for (const tx of txs) {
				if (tx.date !== lastDate) {
					lastDate = tx.date;
					hist.createDiv("pa-date-group").setText(fmt.date(tx.date))
				}
				hist.appendChild(this.txRow(tx, false))
			}
			const footer = hist.createDiv("pa-remaining");
			if (b.net > EPS) footer.setText(t("remainingLabel") + " " + fmt.amount(b.net) + " " + t("receivable"));
			else if (b.net < -EPS) footer.setText(t("remainingLabel") + " " + fmt.amount(-b.net) + " " + t("debt"));
			else footer.setText(t("settled"))
		}
	}
	renderTransactions(body) {
		const store = this.plugin.accounts;
		const fmt = store.fmt;
		const L = store.ledger;
		const bar = body.createDiv("pa-toolbar");
		const search = el("input");
		search.type = "search";
		search.placeholder = t("searchTx");
		search.value = this.nav.search;
		const filterSel = el("select");
		for (const [v, key] of FILTERS) filterSel.appendChild(new Option(t(key), v));
		filterSel.value = this.nav.filter;
		const catFilter = el("select");
		catFilter.appendChild(new Option(t("filterCategory"), ""));
		for (const c of this.plugin.settings.categories) {
			catFilter.appendChild(new Option(c, c))
		}
		catFilter.value = this.nav.categoryFilter || "";
		const sortSel = el("select");
		for (const [v, key] of SORTS) sortSel.appendChild(new Option(t(key), v));
		sortSel.value = this.nav.sort;
		bar.append(search, filterSel, catFilter, sortSel);
		if (this.plugin.settings.savedViews.length) {
			const vSel = el("select");
			vSel.appendChild(new Option("— " + t("savedViews") + " —", ""));
			for (const v of this.plugin.settings.savedViews) {
				vSel.appendChild(new Option(v.name, v.id))
			}
			vSel.onchange = () => {
				const v = this.plugin.settings.savedViews.find(x => x.id === vSel.value);
				if (v) {
					this.nav.search = v.query || "";
					this.nav.filter = v.filter || "all";
					this.nav.sort = v.sort || "newest";
					this.render()
				}
			};
			bar.appendChild(vSel)
		}
		const saveViewBtn = el("button", "pa-btn small", "💾 " + t("saveView"));
		/* ✅ FIX #22: جایگزینی prompt() با TextPromptModal */
		saveViewBtn.onclick = () => {
			new TextPromptModal(this.app, {
				title: t("saveView"),
				label: t("viewName"),
				placeholder: t("viewName"),
				requiredMsg: t("viewName"),
				confirmLabel: t("save"),
				onSubmit: async (name) => {
					const trimmed = name.trim();
					if (this.plugin.settings.savedViews.some(v => v.name === trimmed)) {
						new Notice("⚠ " + trimmed);
						return
					}
					this.plugin.settings.savedViews.push({
						id: randomId("v"),
						name: trimmed,
						query: this.nav.search,
						filter: this.nav.filter,
						sort: this.nav.sort
					});
					await this.plugin.saveSettings();
					new Notice(t("viewSaved"));
					this.render()
				}
			}).open()
		};
		bar.appendChild(saveViewBtn);
		attachTooltip(filterSel, t("tipFilter"), null, {
			delay: 500
		});
		attachTooltip(catFilter, t("tipCategoryFilter"), null, {
			delay: 500
		});
		attachTooltip(sortSel, t("tipSort"), null, {
			delay: 500
		});
		attachTooltip(saveViewBtn, t("tipSaveView"), null, {
			delay: 500
		});
		const list = body.createDiv("pa-card");
		const renderList = () => {
			list.empty();
			const filters = parseQuery(this.nav.search.trim());
			const txs = store.data.transactions.filter(tx => {
				const st = L.states.get(tx.id);
				switch (this.nav.filter) {
					case "receivables":
						if (!(tx.type === "receivable" || tx.type === "payment_received")) return false;
						break;
					case "debts":
						if (!(tx.type === "debt" || tx.type === "payment_made")) return false;
						break;
					case "settled":
						if (!st || st.status !== "settled") return false;
						break;
					case "unsettled":
						if (!st || st.status === "settled") return false;
						break;
					case "overdue":
						if (!st || !st.due || st.due.kind !== "overdue") return false;
						break;
					case "due-soon":
						if (!st || !st.due || st.due.kind !== "today" && st.due.kind !== "soon") return false;
						break
				}
				if (this.nav.categoryFilter && tx.category !== this.nav.categoryFilter) return false;
				return matchesQuery(tx, filters, store)
			});
			const byDue = (a, b) => {
				const sa = L.states.get(a.id),
					sb = L.states.get(b.id);
				const da = sa && sa.due ? sa.due.days : 999999;
				const db = sb && sb.due ? sb.due.days : 999999;
				return da - db || b.date.localeCompare(a.date)
			};
			const comparators = {
				newest: (a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt,
				oldest: (a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt,
				highest: (a, b) => b.amount - a.amount,
				lowest: (a, b) => a.amount - b.amount,
				due: byDue
			};
			txs.sort(comparators[this.nav.sort]);
			if (!txs.length) list.createDiv("pa-empty").setText(t("noTxMatch"));
			let lastDate = "";
			for (const tx of txs) {
				if (this.nav.sort === "newest" || this.nav.sort === "oldest") {
					if (tx.date !== lastDate) {
						lastDate = tx.date;
						list.createDiv("pa-date-group").setText(fmt.date(tx.date))
					}
				}
				list.appendChild(this.txRow(tx, true))
			}
		};
		search.oninput = () => {
			this.nav.search = search.value;
			renderList()
		};
		filterSel.onchange = () => {
			this.nav.filter = filterSel.value;
			renderList()
		};
		catFilter.onchange = () => {
			this.nav.categoryFilter = catFilter.value;
			renderList()
		};
		sortSel.onchange = () => {
			this.nav.sort = sortSel.value;
			renderList()
		};
		renderList()
	}
	renderAnalytics(body) {
		const store = this.plugin.accounts;
		const fmt = store.fmt;
		const data = store.data;
		if (!data.transactions.length) {
			body.createDiv("pa-empty").setText(t("noTx"));
			return
		}
		const kpiCard = body.createDiv("pa-card pa-kpi-card");
		kpiCard.appendChild(renderKpiCards(data, fmt));
		const sub = body.createDiv("pa-analytics-tabs");
		const tabs = [
			["overview", t("anaOverview")],
			["trends", t("anaTrends")],
			["breakdown", t("anaBreakdown")],
			["cashflow", t("anaCashflow")],
			["report", t("anaReport")]
		];
		const current = this.nav.analyticsTab || "overview";
		for (const [id, label] of tabs) {
			const b = el("button", "pa-btn" + (id === current ? " active" : ""), label);
			b.onclick = () => {
				this.nav.analyticsTab = id;
				this.render()
			};
			sub.appendChild(b)
		}
		if (current === "overview") this.renderAnaOverview(body, data, fmt);
		else if (current === "trends") this.renderAnaTrends(body, data, fmt);
		else if (current === "breakdown") this.renderAnaBreakdown(body, data, fmt);
		else if (current === "cashflow") this.renderAnaCashflow(body, data, fmt);
		else if (current === "report") this.renderMonthlyReport(body, data, fmt)
	}
	renderAnaOverview(body, data, fmt) {
		const row1 = body.createDiv("pa-grid-2");
		const c1 = row1.createDiv("pa-card");
		this.cardTitle(c1, "chartTopDebtors", "helpTopDebtors");
		c1.appendChild(renderTopBars(data, fmt, "debtors"));
		const c2 = row1.createDiv("pa-card");
		this.cardTitle(c2, "chartTopCreditors", "helpTopCreditors");
		c2.appendChild(renderTopBars(data, fmt, "creditors"));
		const row2 = body.createDiv("pa-grid-2");
		const c3 = row2.createDiv("pa-card");
		this.cardTitle(c3, "chartAge", "helpAge");
		c3.appendChild(renderAgingDonut(data, fmt));
		const c4 = row2.createDiv("pa-card");
		this.cardTitle(c4, "chartPaymentSpeed", "helpPaymentSpeed");
		c4.appendChild(renderPaymentSpeedGauge(data, fmt))
	}
	renderAnaTrends(body, data, fmt) {
		const c1 = body.createDiv("pa-card");
		this.cardTitle(c1, "chartTrendCum", "helpTrendCum");
		c1.appendChild(renderTrendChart(data, fmt));
		const c2 = body.createDiv("pa-card");
		this.cardTitle(c2, "chartTrendNet", "helpTrendNet");
		c2.appendChild(renderNetTrendChart(data, fmt));
		const c3 = body.createDiv("pa-card");
		this.cardTitle(c3, "chartHeatmap", "helpHeatmap");
		c3.appendChild(renderHeatmap(data, fmt))
	}
	renderAnaBreakdown(body, data, fmt) {
		const row1 = body.createDiv("pa-grid-2");
		const c1 = row1.createDiv("pa-card");
		this.cardTitle(c1, "chartPie", "helpPie");
		c1.appendChild(renderPieChart(data, fmt));
		const c2 = row1.createDiv("pa-card");
		this.cardTitle(c2, "chartRadial", "helpRadar");
		c2.appendChild(renderRadarChart(data, fmt));
		const c3 = body.createDiv("pa-card");
		this.cardTitle(c3, "chartCatCompare", "helpCatCompare");
		c3.appendChild(renderCategoryCompare(data, fmt));
		const c4 = body.createDiv("pa-card");
		this.cardTitle(c4, "chartBar", "helpBarPerson");
		c4.appendChild(renderBarChart(data, fmt))
	}
	renderAnaCashflow(body, data, fmt) {
		const c1 = body.createDiv("pa-card");
		this.cardTitle(c1, "chartWaterfall", "helpWaterfall");
		c1.appendChild(renderWaterfallChart(data, fmt));
		this.renderCashFlowContent(body, data, fmt)
	}
	renderMonthlyReport(body, data, fmt) {
		const months = new Set;
		for (const tx of data.transactions) months.add(tx.date.slice(0, 7));
		const list = [...months].sort().reverse();
		if (!list.length) {
			body.createDiv("pa-empty").setText(t("noTx"));
			return
		}
		const bar = body.createDiv("pa-toolbar");
		const sel = el("select");
		for (const m of list) {
			const label = this.plugin.settings.calendar === "jalali" ? this.fmtMonthFa(m) : this.fmtMonthEn(m);
			sel.appendChild(new Option(label, m))
		}
		bar.appendChild(sel);
		const grid = body.createDiv("pa-report-grid");
		const listCard = body.createDiv("pa-card");
		listCard.createDiv("pa-card-title").setText(t("repTxList"));
		const listWrap = listCard.createDiv("pa-scroll");
		const render = () => {
			grid.empty();
			listWrap.empty();
			const ym = sel.value;
			const txs = data.transactions.filter(tx => tx.date.startsWith(ym));
			const sum = type => txs.filter(t => t.type === type).reduce((s, t) => s + t.amount, 0);
			const rec = sum("receivable"),
				debt = sum("debt");
			const got = sum("payment_received"),
				paid = sum("payment_made");
			const net = rec - got - (debt - paid);
			const tile = (label, value, cls) => {
				const d = el("div", "pa-stat" + (cls ? " " + cls : ""));
				d.createDiv("pa-stat-label").setText(label);
				d.createDiv("pa-stat-value").setText(value);
				grid.appendChild(d)
			};
			tile(t("statTotalRec"), fmt.amount(rec), "accent-rec");
			tile(t("statTotalDebt"), fmt.amount(debt), "accent-debt");
			tile(t("repGot"), fmt.amount(got), "accent-rec");
			tile(t("repPaid"), fmt.amount(paid), "accent-debt");
			tile(t("statNet"), fmt.amount(net), "accent-net");
			tile(t("repCount"), localizeDigits(String(txs.length), CURRENT.locale === "fa"));
			if (!txs.length) listWrap.createDiv("pa-empty").setText(t("noTx"));
			else
				for (const tx of txs.sort((a, b) => b.date.localeCompare(a.date))) {
					listWrap.appendChild(this.txRow(tx, true))
				}
		};
		sel.onchange = render;
		render()
	}
	fmtMonthFa(ym) {
		const j = Cal.isoToJ(ym + "-01");
		if (!j) return ym;
		return Cal.monthName(j.jm) + " " + localizeDigits(String(j.jy), true)
	}
	fmtMonthEn(ym) {
		const [y, m] = ym.split("-").map(Number);
		return GREG_MONTHS_EN[m - 1] + " " + y
	}
	/* ✅ FIX #27: استفاده از this.plugin.accounts به‌جای store تعریف‌نشده */
	renderCashFlowContent(body, data, fmt) {
		const wrap = body;
		const periods = [{
			days: 7,
			label: t("cfWeek")
		}, {
			days: 30,
			label: t("cfMonth")
		}, {
			days: 90,
			label: t("cfQuarter")
		}];
		const today = todayISO();
		const states = computeTxStates(data, today, 7);
		const names = new Map(data.people.map(p => [p.id, p.name]));
		const container = wrap.createDiv("pa-cashflow");
		for (const p of periods) {
			const end = toISO(new Date(Date.now() + p.days * 864e5));
			let inc = 0,
				out = 0;
			for (const tx of data.transactions) {
				if (!tx.dueDate || tx.dueDate < today || tx.dueDate > end) continue;
				const st = states.get(tx.id);
				if (!st || st.status === "settled") continue;
				if (tx.type === "receivable") inc += st.remaining;
				else if (tx.type === "debt") out += st.remaining
			}
			const row = el("div", "pa-cashflow-row " + (inc - out >= 0 ? "pos" : "neg"));
			row.createDiv("pa-cashflow-label").setText(p.label);
			const amt = row.createDiv("pa-cashflow-amt");
			amt.setText("+" + fmt.amount(inc, false) + " / −" + fmt.amount(out, false));
			container.appendChild(row)
		}
		const detail = wrap.createDiv("pa-scroll");
		detail.style.marginTop = "12px";
		detail.createDiv("pa-card-title").setText(t("cfDetail"));
		const end30 = toISO(new Date(Date.now() + 30 * 864e5));
		const upcoming = [];
		for (const tx of data.transactions) {
			if (!tx.dueDate || tx.dueDate < today || tx.dueDate > end30) continue;
			const st = states.get(tx.id);
			if (!st || st.status === "settled") continue;
			upcoming.push({
				tx,
				st
			})
		}
		upcoming.sort((a, b) => a.tx.dueDate.localeCompare(b.tx.dueDate));
		if (!upcoming.length) detail.createDiv("pa-empty").setText(t("nothingDue"));
		for (const {
				tx,
				st
			}
			of upcoming) {
			const row = el("div", "pa-row");
			const main = row.createDiv("pa-row-main");
			main.createDiv("pa-row-title").setText(names.get(tx.personId) + " — " + fmt.amount(st.remaining));
			const sub = main.createDiv("pa-row-sub");
			sub.appendChild(el("span", "pa-chip", fmt.date(tx.dueDate)));
			sub.appendChild(el("span", "pa-chip", typeLabel(tx.type)));
			/* ✅ FIX: store → this.plugin.accounts */
			row.onclick = () => new TransactionDetailModal(this.app, this.plugin.accounts, tx, {}).open();
			detail.appendChild(row)
		}
	}
}
class PersonalAccountsPlugin extends Plugin {
	async onload() {
		await this.loadSettings();
		this.fmt = new Fmt(() => this.settings);
		this.repo = new PluginDataStore(this.app, () => this.settings, this.fmt, this);
		this.accounts = new AccountsStore(this);
		Cal.appRef = this.app;
		Cal.refresh(this.app);
		this.app.workspace.onLayoutReady(() => {
			Cal.refresh(this.app)
		});
		this.registerView(VIEW_TYPE_PERSONAL_ACCOUNTS, leaf => new AccountsView(leaf, this));
		this.addRibbonIcon("wallet", t("ribDashboard"), () => {
			void this.openView("dashboard")
		});
		this.addRibbonIcon("banknote-arrow-up", t("ribQuickAdd"), () => {
			void this.quickAddTransaction()
		});
		this.addSettingTab(new PASettingTab(this.app, this));
		this.addCommand({
			id: "open-dashboard",
			name: t("cmdOpen"),
			callback: () => {
				void this.openView("dashboard")
			}
		});
		this.addCommand({
			id: "add-transaction",
			name: t("cmdAddTx"),
			callback: () => {
				void this.quickAddTransaction()
			}
		});
		this.addCommand({
			id: "add-person",
			name: t("cmdAddPerson"),
			callback: () => new PersonModal(this.app, this.accounts, null, {}).open()
		});
		this.addCommand({
			id: "search-transactions",
			name: t("cmdSearch"),
			callback: () => {
				void this.openView("transactions")
			}
		});
		if (!this.settings._migratedToMd) {
			setTimeout(() => this._migrateToMd(), 2e3)
		}
		this.app.workspace.onLayoutReady(() => {
			setTimeout(async () => {
				try {
					await this.accounts.ready();
					const L = this.accounts.ledger;
					if (!L) return;
					const path = this.repo.filePath();
					const file = this.app.vault.getAbstractFileByPath(path);
					if (!file && this.settings._hadDataBefore) {
						new Notice(t("fileMissingWarn"), 12e3)
					}
					if (this.accounts.data.transactions.length > 0 || this.accounts.data.people.length > 0) {
						this.settings._hadDataBefore = true;
						void this.saveSettings()
					}
					const {
						overdueCount,
						dueSoonCount
					} = L.stats;
					if (overdueCount > 0 || dueSoonCount > 0) {
						const fa = CURRENT.locale === "fa";
						const parts = [];
						if (overdueCount) parts.push(localizeDigits(String(overdueCount), fa) + " " + t("statOverdue"));
						if (dueSoonCount) parts.push(localizeDigits(String(dueSoonCount), fa) + " " + t("statDueSoon"));
						new Notice("⏰ " + t("appTitle") + ": " + parts.join(" · "), 7e3)
					}
					const today = new Date;
					const dayOfMonth = today.getDate();
					const monthKey = todayISO().slice(0, 7);
					for (const tpl of this.settings.recurringTemplates || []) {
						if (tpl.dayOfMonth !== dayOfMonth) continue;
						if (tpl._lastRun === monthKey) continue;
						new Notice("🔁 " + t("recurringDue", {
							name: tpl.name
						}), 8e3)
					}
				} catch (e) {}
			}, 3500)
		})
	}
	onunload() {}
	async _migrateToMd() {
		try {
			const raw = await this.loadData();
			if (raw && (Array.isArray(raw.people) || Array.isArray(raw.transactions))) {
				const oldData = sanitizeData(raw);
				if (oldData.people.length || oldData.transactions.length) {
					/* ✅ FIX #4: جایگزینی confirm() با ConfirmModal */
					new ConfirmModal(this.app, {
						title: CURRENT.locale === "fa" ? "داده‌های قدیمی پیدا شد" : "Old data found",
						lines: [
							CURRENT.locale === "fa" ? "داده‌های قدیمی در data.json پیدا شد. به فایل MD منتقل شود؟" : "Old data found in data.json. Migrate to MD file?",
							oldData.people.length + " " + t("tabPeople") + " · " + oldData.transactions.length + " " + t("tabTransactions")
						],
						confirmLabel: CURRENT.locale === "fa" ? "انتقال" : "Migrate",
						onConfirm: async () => {
							try {
								await this.repo.save(oldData);
								await this.saveData({
									settings: this.settings,
									settingsVersion: this.settings.settingsVersion
								});
								new Notice(CURRENT.locale === "fa" ? "✅ داده‌ها به فایل MD منتقل شد" : "✅ Data migrated to MD file");
								await this.accounts.reload()
							} catch (e) {
								console.error("Migration error:", e)
							}
						}
					}).open()
				}
			}
			this.settings._migratedToMd = true;
			await this.saveSettings()
		} catch (e) {
			console.error("Migration error:", e)
		}
	}
	async loadSettings() {
		const raw = await this.loadData() || {};
		const saved = raw.settings ? raw.settings : {};
		this.settings = Object.assign({}, DEFAULT_SETTINGS, saved);
		if (!raw.settingsVersion || raw.settingsVersion < 4) {
			if (!raw.settingsVersion || raw.settingsVersion < 3) {
				this.settings.locale = "en";
				this.settings.calendar = "gregorian";
				this.settings.currency = "usd"
			}
			this.settings.settingsVersion = 4
		}
		if (!Array.isArray(this.settings.categories) || this.settings.categories.length === 0) {
			this.settings.categories = this.settings.locale === "fa" ? [...DEFAULT_CATEGORIES_FA] : [...DEFAULT_CATEGORIES_EN]
		}
		CURRENT.locale = this.settings.locale
	}
	async saveSettings() {
		const oldLocale = CURRENT.locale;
		CURRENT.locale = this.settings.locale;
		if (oldLocale !== this.settings.locale) {
			const oldDefaults = oldLocale === "fa" ? DEFAULT_CATEGORIES_FA : DEFAULT_CATEGORIES_EN;
			const isDefault = JSON.stringify(this.settings.categories) === JSON.stringify(oldDefaults);
			if (isDefault) {
				this.settings.categories = this.settings.locale === "fa" ? [...DEFAULT_CATEGORIES_FA] : [...DEFAULT_CATEGORIES_EN]
			}
		}
		await this.saveData({
			settings: this.settings,
			settingsVersion: this.settings.settingsVersion
		});
		if (this.accounts) await this.accounts.reload()
	}
	async openView(screen) {
		try {
			const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_PERSONAL_ACCOUNTS);
			const leaf = existing.length ? existing[0] : this.app.workspace.getLeaf(this.app.isMobile ? false : true);
			await leaf.setViewState({
				type: VIEW_TYPE_PERSONAL_ACCOUNTS,
				active: true
			});
			this.app.workspace.revealLeaf(leaf);
			if (leaf.view instanceof AccountsView) leaf.view.navigate({
				screen: screen || "dashboard"
			})
		} catch (e) {
			new Notice("⚠ " + (e instanceof Error ? e.message : String(e)))
		}
	}
	async quickAddTransaction() {
		try {
			await this.accounts.ready();
			new TransactionFormModal(this.app, this.accounts, null, {
				onSaved: () => {
					if (this.settings.openAfterAdd) void this.openView("dashboard")
				}
			}).open()
		} catch (e) {
			new Notice("⚠ " + (e instanceof Error ? e.message : String(e)))
		}
	}
}
module.exports = PersonalAccountsPlugin;
module.exports.default = PersonalAccountsPlugin;



// Shared settings footer: local styling, no requests until a link is opened.
function renderCreatorSupport(container, language) {
  function element(parent, tag, options = {}) {
    const node = parent.ownerDocument.createElement(tag);
    if (options.cls) node.className = options.cls;
    if (options.text !== undefined) node.textContent = options.text;
    if (options.href) node.setAttribute('href', options.href);
    for (const [key, value] of Object.entries(options.attr || {})) node.setAttribute(key, value);
    parent.appendChild(node);
    return node;
  }
  const fa = language === 'fa';
  const root = element(container, 'section', { cls: 'ot-support', attr: { dir: fa ? 'rtl' : 'ltr', 'aria-label': fa ? 'ارتباط با ما و حمایت' : 'Connect and support' } });
  element(root, 'style', { text: `
    .ot-support{margin-block:28px 12px;padding:20px;border:1px solid var(--background-modifier-border);border-radius:18px;background:var(--background-secondary);color:var(--text-normal)}
    .ot-support h3{margin:0 0 8px;font-size:1.1em;color:var(--text-normal)}
    .ot-support p{margin:0 0 18px;color:var(--text-muted);line-height:1.8}
    .ot-support .ot-support-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:10px}
    .ot-support a.ot-support-card{display:flex;align-items:center;gap:12px;min-width:0;min-height:80px;padding:14px;border:1px solid var(--background-modifier-border);border-inline-start:4px solid var(--ot-brand);border-radius:12px;background:var(--background-primary);color:var(--text-normal);text-decoration:none;box-shadow:0 3px 12px rgba(0,0,0,.035)}
    .ot-support .ot-support-icon{display:flex;align-items:center;justify-content:center;flex:0 0 40px;height:40px;border-radius:12px;background:var(--background-secondary);color:var(--ot-brand)}
    .ot-support .ot-support-icon svg{width:23px;height:23px}
    .ot-support .ot-support-info{display:flex;flex:1;min-width:0;flex-direction:column;gap:5px}
    .ot-support .ot-support-label{font-weight:600;line-height:1.5}
    .ot-support .ot-support-detail{font-size:.8em;color:var(--text-muted);overflow-wrap:anywhere}
    .ot-support .ot-support-action{font-size:.8em;color:var(--text-muted);flex-shrink:0}
    .ot-support a.ot-support-donate{background:linear-gradient(125deg,var(--background-primary),var(--background-secondary));border-color:var(--background-modifier-border);border-inline-start-color:var(--ot-brand)}
    .ot-support .ot-support-donate .ot-support-action{padding:7px 10px;border-radius:8px;background:var(--interactive-accent);color:var(--text-on-accent)}
    .ot-support a.ot-support-card:focus-visible{outline:2px solid var(--interactive-accent);outline-offset:3px}
  ` });
  element(root, 'h3', { text: fa ? 'ارتباط با ما' : 'Connect with us' });
  element(root, 'p', { text: fa ? 'آموزش‌ها، تازه‌ها و پشتیبانی؛ همراه شما در دنیای ابسیدین.' : 'Tutorials, updates and support for your Obsidian journey.' });
  const grid = element(root, 'div', { cls: 'ot-support-grid' });
  const links = [
    ['bale', 'message-circle', '#22a06b', fa ? 'کانال بله' : 'Bale Channel', 'https://ble.ir/obsidiantut'],
    ['telegram', 'send', '#229ed9', fa ? 'کانال تلگرام' : 'Telegram Channel', 'https://t.me/obsidiantut'],
    ['youtube', 'youtube', '#e5484d', fa ? 'کانال یوتیوب' : 'YouTube Channel', 'https://youtube.com/@obsidiantut'],
    ['donate', 'heart', '#b879cd', fa ? 'حمایت از توسعهٔ افزونه‌ها' : 'Support plugin development', 'https://reymit.ir/singhaf9270']
  ];
  for (const [id, icon, color, label, url] of links) {
    const donate = id === 'donate';
    const card = element(grid, 'a', { cls: 'ot-support-card' + (donate ? ' ot-support-donate' : ''), href: url, attr: { target: '_blank', rel: 'noopener noreferrer', 'aria-label': label } });
    card.style.setProperty('--ot-brand', color);
    const iconEl = element(card, 'span', { cls: 'ot-support-icon', attr: { 'aria-hidden': 'true' } });
    require('obsidian').setIcon(iconEl, icon);
    const info = element(card, 'span', { cls: 'ot-support-info' });
    element(info, 'span', { cls: 'ot-support-label', text: label });
    const detail = element(info, 'span', { cls: 'ot-support-detail', text: donate ? (fa ? 'با همراهی شما، بهتر می‌سازیم.' : 'Your support keeps us building.') : '@obsidiantut' });
    if (!donate) detail.setAttribute('dir', 'ltr');
    element(card, 'span', { cls: 'ot-support-action', text: donate ? (fa ? 'حمایت مالی' : 'Donate') : (fa ? 'عضویت ↗' : 'Join ↗') });
  }
}
