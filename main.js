'use strict';

/* =========================================================================
 * Personal Accounts — حساب‌های شخصی
 * داده‌ها در data.json پلاگین ذخیره می‌شوند (نه در یادداشت).
 * یادداشت فقط جدول خوانا می‌شود (اختیاری).
 * ========================================================================= */

const {
  Plugin, ItemView, Modal, Notice, PluginSettingTab, Setting,
  TFile, normalizePath, setIcon,
} = require('obsidian');

/* ========================= ثابت‌ها ========================= */

const VIEW_TYPE_PERSONAL_ACCOUNTS = 'personal-accounts-view';
const DATA_VERSION = 1;
const DEFAULT_FILE_PATH = 'Personal Accounts.md';
const EPS = 1e-6;

const CURRENCIES = [
  { code: 'usd', label: 'USD', labelFa: 'دلار', symbol: '$' },
  { code: 'toman', label: 'Toman', labelFa: 'تومان', symbol: 'ت' },
  { code: 'rial', label: 'Rial', labelFa: 'ریال', symbol: 'ر' },
  { code: 'eur', label: 'EUR', labelFa: 'یورو', symbol: '€' },
  { code: 'gbp', label: 'GBP', labelFa: 'پوند', symbol: '£' },
  { code: 'aed', label: 'AED', labelFa: 'درهم', symbol: 'د.إ' },
  { code: 'try', label: 'TRY', labelFa: 'لیر', symbol: '₺' },
  { code: 'cny', label: 'CNY', labelFa: 'یوان', symbol: '¥' },
  { code: 'jpy', label: 'JPY', labelFa: 'ین', symbol: '¥' },
  { code: 'cad', label: 'CAD', labelFa: 'دلار کانادا', symbol: 'C$' },
  { code: 'aud', label: 'AUD', labelFa: 'دلار استرالیا', symbol: 'A$' },
  { code: 'chf', label: 'CHF', labelFa: 'فرانک', symbol: 'Fr' },
  { code: 'sek', label: 'SEK', labelFa: 'کرون سوئد', symbol: 'kr' },
  { code: 'rub', label: 'RUB', labelFa: 'روبل', symbol: '₽' },
  { code: 'inr', label: 'INR', labelFa: 'روپیه', symbol: '₹' },
  
];

const DEFAULT_CATEGORIES = ['Project', 'Purchase', 'Loan', 'Service', 'Work', 'Friends', 'Family', 'Other'];
const DEFAULT_CATEGORIES_FA = ['پروژه', 'خرید', 'وام', 'خدمات', 'کار', 'دوستان', 'خانواده', 'سایر'];
const OLD_DEFAULT_CATEGORIES = ['Project', 'Purchase', 'Loan', 'Service', 'Work', 'Friends', 'Family', 'Other'];

const VALID_TYPES = ['receivable', 'debt', 'payment_received', 'payment_made'];
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

/* ========================= متن‌ها (i18n) ========================= */

const STRINGS = {
  fa: {
    appTitle: 'حساب‌های شخصی',
    tabDashboard: 'داشبورد', tabPeople: 'افراد', tabTransactions: 'تراکنش‌ها',
    addTx: '+ تراکنش', reload: 'بازخوانی از فایل',

    statTotalRec: 'مطالبات کل', statTotalDebt: 'بدهی‌های کل', statNet: 'مانده خالص',
    statPeople: 'افراد', statUnsettled: 'حساب‌های باز', statSettled: 'تسویه‌شده',
    statOverdue: 'سررسید گذشته', statDueSoon: 'نزدیک سررسید',

    upcoming: 'سررسیدها و عقب‌افتاده‌ها', nothingDue: 'چیزی برای پیگیری نیست — همه‌چیز مرتب است.',
    getStarted: 'برای شروع، با دکمهٔ «+ تراکنش» اولین طلب یا بدهی را ثبت کنید.',
    peopleCard: 'افراد', viewAll: 'مشاهدهٔ همه',

    searchPeople: 'جستجوی افراد…', addPersonBtn: 'افزودن شخص',
    noPeople: 'شخصی یافت نشد.', settled: 'تسویه‌شده', noBalance: '—',
    receivable: 'طلب', debt: 'بدهی',

    back: '→ بازگشت', recRemaining: 'مانده مطالبات', debtRemaining: 'مانده بدهی‌ها',
    net: 'خالص', addRec: '+ طلب', addDebt: '+ بدهی',
    recordPayment: 'ثبت پرداخت', settleAccount: 'تسویهٔ حساب', deletePersonBtn: 'حذف شخص',
    history: 'تاریخچهٔ تراکنش‌ها', noTx: 'هنوز تراکنشی ثبت نشده است.', remainingLabel: 'باقیمانده:',

    addPersonTitle: 'افزودن شخص', editPersonTitle: 'ویرایش شخص',
    fName: 'نام *', fPhone: 'تلفن', fEmail: 'ایمیل', fTags: 'برچسب‌ها (با کاما)', fNotes: 'یادداشت',
    phName: 'نام کامل', phPhone: 'تلفن (اختیاری)', phEmail: 'ایمیل (اختیاری)', phTags: 'برچسب‌ها، با کاما',
    nameRequired: 'نام الزامی است.', personSaved: 'شخص ذخیره شد',
    save: 'ذخیره', cancel: 'انصراف',

    addTxTitle: 'افزودن تراکنش', editTxTitle: 'ویرایش تراکنش',
    fType: 'نوع', typeReceivable: 'طلب', typeDebt: 'بدهی',
    typePaymentReceived: 'دریافت شد', typePaymentMade: 'پرداخت شد',
    fPerson: 'شخص *', phPerson: 'نام را بنویسید — نام تازه خودکار ساخته می‌شود',
    personRequired: 'نام شخص الزامی است.',
    fAmount: 'مبلغ *', phAmount: 'مثلاً ۵٬۰۰۰٬۰۰۰',
    amountInvalid: 'یک مبلغ معتبر و بزرگ‌تر از صفر وارد کنید.',
    fDate: 'تاریخ', fDue: 'سررسید (اختیاری)',
    fCategory: 'دسته', noCategory: '— بدون دسته —',
    fDesc: 'شرح / دلیل', phDesc: 'دلیل / شرح',
    txAdded: 'تراکنش ثبت شد', txUpdated: 'تراکنش به‌روزرسانی شد',

    pickDate: 'انتخاب تاریخ…', todayBtn: 'امروز', clearBtn: 'پاک کردن',

    statusOpen: 'باز', statusPartial: 'بخشی پرداخت شد — {amt} باقیمانده',
    dPerson: 'شخص', dAmount: 'مبلغ', dDate: 'تاریخ', dStatus: 'وضعیت', dDue: 'سررسید',
    dCategory: 'دسته', dDesc: 'شرح', dNotes: 'یادداشت', dLinked: 'پیوند با',
    edit: 'ویرایش', delete: 'حذف', settleRemaining: 'تسویهٔ باقی‌مانده',
    settleTxTitle: 'تسویهٔ تراکنش',
    settleRecLine: 'ثبت «دریافت شد» به مبلغ {amt} از {name}؟',
    settleDebtLine: 'ثبت «پرداخت شد» به مبلغ {amt} به {name}؟',
    settleNote: 'تسویه به‌صورت یک تراکنش پرداخت جدید ثبت می‌شود و رکورد اصلی دست‌نخورده می‌ماند.',
    settle: 'تسویه', deleteTxTitle: 'حذف تراکنش؟', deleteTxNote: 'این عمل قابل بازگشت نیست.',
    txDeleted: 'تراکنش حذف شد',

    confirm: 'تأیید', deletePersonTitle: 'حذف شخص؟',
    deletePersonLine: '«{name}» و همهٔ تراکنش‌های او حذف شود؟',
    settleFor: 'تسویهٔ {id}', accountSettlement: 'تسویهٔ حساب',

    dueOverdue1: 'سررسید گذشته (۱ روز)', dueOverdueN: 'سررسید گذشته ({n} روز)',
    dueToday: 'سررسید امروز', dueTomorrow: 'سررسید فردا', dueInN: 'سررسید تا {n} روز دیگر',

    filterAll: 'همه', filterRec: 'مطالبات', filterDebt: 'بدهی‌ها',
    filterSettled: 'تسویه‌شده', filterUnsettled: 'تسویه‌نشده',
    filterOverdue: 'سررسید گذشته', filterDueSoon: 'نزدیک سررسید',
    sortNewest: 'جدیدترین', sortOldest: 'قدیمی‌ترین', sortHighest: 'بیشترین مبلغ',
    sortLowest: 'کمترین مبلغ', sortDue: 'نزدیک‌ترین سررسید',
    searchTx: 'جستجو: نام، شرح، دسته…', noTxMatch: 'تراکنشی یافت نشد.',

    dataProblem: 'مشکل در فایل داده', unknownError: 'خطای نامشخص.',
    retry: 'تلاش دوباره',

    setStorage: 'ذخیره‌سازی', setCentralFile: 'فایل یادداشت گزارش',
    setCentralFileDesc: 'فایل مارک‌داونی که جدول‌های خوانا در آن نوشته می‌شود. داده‌ها در data.json پلاگین ذخیره می‌شوند.',
    openFile: 'باز کردن فایل', setCurrency: 'واحد پول',
    setCurrencyDesc: 'مبالغ به‌صورت عدد ذخیره می‌شوند؛ واحد پول فقط برای نمایش است.',
    setLang: 'زبان / ارقام', setCalendar: 'تقویم',
    setCalendarDesc: 'برای نمایش تعطیلات و رویدادها، در صورت نصب بودن پلاگین «Persian Calendar» به‌صورت خودکار از آن استفاده می‌شود.',
    calJalali: 'شمسی (جلالی)', calGregorian: 'میلادی',
    setDateFormat: 'قالب تاریخ میلادی', setDateFormatDesc: 'الگوها: YYYY، MMM، MM، DD',
    setCompact: 'نمایش فشرده', setCategories: 'دسته‌بندی‌های تراکنش',
    setCategoriesDesc: 'هر دسته در یک خط.', setDueSoon: 'بازهٔ «نزدیک سررسید» (روز)',
    setConfirmDel: 'تأیید قبل از حذف', setOpenAfterAdd: 'باز کردن داشبورد پس از افزودن سریع',
    setLedger: 'جدول خوانا در فایل یادداشت',
    setLedgerDesc: 'اگر روشن باشد، جدول‌های خوانا در فایل یادداشت نوشته می‌شوند.',

    setBackup: 'پشتیبان‌گیری',
    setExportJSON: 'خروجی JSON',
    setExportJSONDesc: 'داده‌ها را به‌صورت فایل JSON دانلود کنید.',
    setImportJSON: 'ورود از JSON',
    setImportJSONDesc: 'یک فایل JSON پشتیبان را بارگذاری کنید (جایگزین داده‌های فعلی می‌شود).',
    exportBtn: 'دانلود JSON', importBtn: 'انتخاب فایل',
    exportDone: 'فایل JSON دانلود شد', importDone: 'داده‌ها وارد شد',
    importError: 'خطا در خواندن فایل',

    cmdOpen: 'باز کردن داشبورد حساب‌ها', cmdAddTx: 'افزودن تراکنش',
    cmdAddPerson: 'افزودن شخص', cmdSearch: 'جستجوی تراکنش‌ها',
    ribDashboard: 'حساب‌های شخصی — داشبورد', ribQuickAdd: 'حساب‌های شخصی — ثبت سریع تراکنش',
    openNote: 'فایل یادداشت',

    ledgerPeopleH: 'افراد و مانده‌ها', ledgerTxH: 'تراکنش‌ها',
    thPerson: 'شخص', thPhone: 'تلفن', thRec: 'طلب', thDebt: 'بدهی', thNet: 'خالص',
    thId: 'شناسه', thDate: 'تاریخ', thType: 'نوع', thAmount: 'مبلغ', thDesc: 'شرح',
  },
  en: {
    appTitle: 'Personal Accounts',
    tabDashboard: 'Dashboard', tabPeople: 'People', tabTransactions: 'Transactions',
    addTx: '+ Transaction', reload: 'Reload from file',

    statTotalRec: 'Total Receivables', statTotalDebt: 'Total Debts', statNet: 'Net Balance',
    statPeople: 'People', statUnsettled: 'Unsettled accounts', statSettled: 'Settled',
    statOverdue: 'Overdue', statDueSoon: 'Due soon',

    upcoming: 'Upcoming & overdue', nothingDue: 'Nothing due — all clear.',
    getStarted: 'Get started: press "+ Transaction" to record your first receivable or debt.',
    peopleCard: 'People', viewAll: 'View all',

    searchPeople: 'Search people…', addPersonBtn: 'Add person',
    noPeople: 'No people found.', settled: 'Settled', noBalance: '—',
    receivable: 'Receivable', debt: 'Debt',

    back: '← Back', recRemaining: 'Receivables remaining', debtRemaining: 'Debts remaining',
    net: 'Net', addRec: '+ Receivable', addDebt: '+ Debt',
    recordPayment: 'Record payment', settleAccount: 'Settle account', deletePersonBtn: 'Delete person',
    history: 'Transaction history', noTx: 'No transactions yet.', remainingLabel: 'Remaining:',

    addPersonTitle: 'Add person', editPersonTitle: 'Edit person',
    fName: 'Name *', fPhone: 'Phone', fEmail: 'Email', fTags: 'Tags (comma separated)', fNotes: 'Notes',
    phName: 'Full name', phPhone: 'Phone (optional)', phEmail: 'Email (optional)', phTags: 'tags, comma separated',
    nameRequired: 'Name is required.', personSaved: 'Person saved',
    save: 'Save', cancel: 'Cancel',

    addTxTitle: 'Add transaction', editTxTitle: 'Edit transaction',
    fType: 'Type', typeReceivable: 'Receivable', typeDebt: 'Debt',
    typePaymentReceived: 'Payment received', typePaymentMade: 'Payment made',
    fPerson: 'Person *', phPerson: 'Type a name — new names create a person automatically',
    personRequired: 'Person name is required.',
    fAmount: 'Amount *', phAmount: 'e.g. 5,000,000',
    amountInvalid: 'Enter a valid positive amount.',
    fDate: 'Date', fDue: 'Due date (optional)',
    fCategory: 'Category', noCategory: '— no category —',
    fDesc: 'Description', phDesc: 'Reason / description',
    txAdded: 'Transaction added', txUpdated: 'Transaction updated',

    pickDate: 'Pick a date…', todayBtn: 'Today', clearBtn: 'Clear',

    statusOpen: 'Open', statusPartial: 'Partial — {amt} remaining',
    dPerson: 'Person', dAmount: 'Amount', dDate: 'Date', dStatus: 'Status', dDue: 'Due date',
    dCategory: 'Category', dDesc: 'Description', dNotes: 'Notes', dLinked: 'Linked to',
    edit: 'Edit', delete: 'Delete', settleRemaining: 'Settle remaining',
    settleTxTitle: 'Settle transaction',
    settleRecLine: 'Record a payment received of {amt} from {name}?',
    settleDebtLine: 'Record a payment made of {amt} to {name}?',
    settleNote: 'The settlement is recorded as a new payment transaction; the original record stays intact.',
    settle: 'Settle', deleteTxTitle: 'Delete transaction?', deleteTxNote: 'This cannot be undone.',
    txDeleted: 'Transaction deleted',

    confirm: 'Confirm', deletePersonTitle: 'Delete person?',
    deletePersonLine: 'Delete "{name}" and all of their transactions?',
    settleFor: 'Settlement for {id}', accountSettlement: 'Account settlement',

    dueOverdue1: 'Overdue (1 day)', dueOverdueN: 'Overdue ({n} days)',
    dueToday: 'Due today', dueTomorrow: 'Due tomorrow', dueInN: 'Due in {n} days',

    filterAll: 'All', filterRec: 'Receivables', filterDebt: 'Debts',
    filterSettled: 'Settled', filterUnsettled: 'Unsettled',
    filterOverdue: 'Overdue', filterDueSoon: 'Due soon',
    sortNewest: 'Newest', sortOldest: 'Oldest', sortHighest: 'Highest amount',
    sortLowest: 'Lowest amount', sortDue: 'Nearest due date',
    searchTx: 'Search person, description, category…', noTxMatch: 'No transactions match.',

    dataProblem: 'Data file problem', unknownError: 'Unknown error.',
    retry: 'Retry',

    setStorage: 'Storage', setCentralFile: 'Readable note file',
    setCentralFileDesc: 'The Markdown file where readable tables are written. Data is stored in the plugin data.json.',
    openFile: 'Open file', setCurrency: 'Currency',
    setCurrencyDesc: 'Amounts are stored as plain numbers; the currency is a display unit.',
    setLang: 'Language / digits', setCalendar: 'Calendar',
    setCalendarDesc: 'If the "Persian Calendar" plugin is installed, it is used automatically for holidays and events.',
    calJalali: 'Jalali (Solar Hijri)', calGregorian: 'Gregorian',
    setDateFormat: 'Gregorian date format', setDateFormatDesc: 'Tokens: YYYY, MMM, MM, DD',
    setCompact: 'Compact view', setCategories: 'Transaction categories',
    setCategoriesDesc: 'One category per line.', setDueSoon: '"Due soon" window (days)',
    setConfirmDel: 'Confirm before deletion', setOpenAfterAdd: 'Open dashboard after quick add',
    setLedger: 'Readable ledger in note file',
    setLedgerDesc: 'If enabled, readable tables are written to the note file.',

    setBackup: 'Backup',
    setExportJSON: 'Export JSON',
    setExportJSONDesc: 'Download the data as a JSON file.',
    setImportJSON: 'Import JSON',
    setImportJSONDesc: 'Load a JSON backup file (replaces current data).',
    exportBtn: 'Download JSON', importBtn: 'Choose file',
    exportDone: 'JSON file downloaded', importDone: 'Data imported',
    importError: 'Error reading file',

    cmdOpen: 'Open dashboard', cmdAddTx: 'Add transaction',
    cmdAddPerson: 'Add person', cmdSearch: 'Search transactions',
    ribDashboard: 'Personal Accounts — dashboard', ribQuickAdd: 'Personal Accounts — quick add',
    openNote: 'Note file',

    ledgerPeopleH: 'People & balances', ledgerTxH: 'Transactions',
    thPerson: 'Person', thPhone: 'Phone', thRec: 'Receivable', thDebt: 'Debt', thNet: 'Net',
    thId: 'ID', thDate: 'Date', thType: 'Type', thAmount: 'Amount', thDesc: 'Description',
  },
};

const CURRENT = { locale: 'en' };

function t(key, vars) {
  const dict = STRINGS[CURRENT.locale] || STRINGS.fa;
  let s = dict[key] != null ? dict[key] : (STRINGS.fa[key] != null ? STRINGS.fa[key] : key);
  if (vars) for (const k in vars) s = s.split('{' + k + '}').join(String(vars[k]));
  return s;
}

/** اصلاح‌شده: payment_received → typePaymentReceived */
function typeLabel(type) {
  const map = {
    receivable: 'typeReceivable',
    debt: 'typeDebt',
    payment_received: 'typePaymentReceived',
    payment_made: 'typePaymentMade',
  };
  return t(map[type] || type);
}

/* ========================= ابزارهای عمومی ========================= */

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}
function pad2(n) { return n < 10 ? '0' + n : String(n); }
function toISO(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function todayISO() { return toISO(new Date()); }

function parseISO(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return null;
  const v = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(v) ? null : v;
}
function diffDays(fromISOStr, toISOStr) {
  const a = parseISO(fromISOStr), b = parseISO(toISOStr);
  if (a === null || b === null) return 0;
  return Math.round((b - a) / 86400000);
}
function isoWeekday(iso) {
  const ms = parseISO(iso);
  return ms === null ? null : new Date(ms).getUTCDay();
}

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';

function normalizeDigits(s) {
  return String(s).replace(/[۰-۹٠-٩]/g, (ch) => {
    const i = FA_DIGITS.indexOf(ch);
    return String(i >= 0 ? i : AR_DIGITS.indexOf(ch));
  });
}
function localizeDigits(s, fa) {
  if (!fa) return String(s);
  return Cal.toFa(s);
}

function parseAmount(input) {
  const cleaned = normalizeDigits(input).replace(/[,٬\s]/g, '').replace(/[٫]/g, '.');
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function attachAmountInput(input, isFa) {
  const format = () => {
    const raw = input.value;
    if (!raw) return;
    const caret = input.selectionStart == null ? raw.length : input.selectionStart;
    const norm = normalizeDigits(raw);
    const digitsBefore = norm.slice(0, caret).replace(/[^0-9]/g, '').length;
    let cleaned = norm.replace(/[^0-9.]/g, '');
    const segs = cleaned.split('.');
    if (segs.length > 2) cleaned = segs[0] + '.' + segs.slice(1).join('');
    if (cleaned === '' || cleaned === '.') { input.value = cleaned; return; }
    const parts = cleaned.split('.');
    const ip = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    let out = localizeDigits(ip, isFa());
    if (parts.length > 1) out += (isFa() ? '٫' : '.') + localizeDigits(parts[1], isFa());
    input.value = out;
    let count = 0, i = 0;
    while (i < out.length && count < digitsBefore) {
      if (/[0-9]/.test(normalizeDigits(out.charAt(i)))) count++;
      i++;
    }
    try { input.setSelectionRange(i, i); } catch (e) { /* noop */ }
  };
  input.addEventListener('input', format);
  return { refresh: format };
}

function randomId(prefix) {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function trxNumberFromId(id) {
  const m = /^TRX-(\d+)$/.exec(id || '');
  return m ? parseInt(m[1], 10) : 0;
}

/* ========================= الگوریتم جلالی داخلی ========================= */

function jDiv(a, b) { return ~~(a / b); }
function jMod(a, b) { return a - ~~(a / b) * b; }
const J_BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];

function jalCal(jy) {
  const bl = J_BREAKS.length;
  const gy = jy + 621;
  let leapJ = -14, jp = J_BREAKS[0], jm, jump = 0, n, i;
  if (jy < jp || jy >= J_BREAKS[bl - 1]) throw new Error('Invalid Jalali year ' + jy);
  for (i = 1; i < bl; i++) {
    jm = J_BREAKS[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + jDiv(jump, 33) * 8 + jDiv(jMod(jump, 33), 4);
    jp = jm;
  }
  n = jy - jp;
  leapJ = leapJ + jDiv(n, 33) * 8 + jDiv(jMod(n, 33) + 3, 4);
  if (jMod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = jDiv(gy, 4) - jDiv((jDiv(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + jDiv(jump + 4, 33) * 33;
  let leap = jMod(jMod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}
function g2d(gy, gm, gd) {
  let d = jDiv((gy + jDiv(gm - 8, 6) + 100100) * 1461, 4)
    + jDiv(153 * jMod(gm + 9, 12) + 2, 5) + gd - 34840408;
  d = d - jDiv(jDiv(gy + 100100 + jDiv(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}
function d2g(jdn) {
  let j = 4 * jdn + 139361631;
  j = j + jDiv(jDiv(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = jDiv(jMod(j, 1461), 4) * 5 + 308;
  const gd = jDiv(jMod(i, 153), 5) + 1;
  const gm = jMod(jDiv(i, 153), 12) + 1;
  const gy = jDiv(j, 1461) - 100100 + jDiv(8 - gm, 6);
  return { gy, gm, gd };
}
function j2d(jy, jm, jd) {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - jDiv(jm, 7) * (jm - 7) + jd - 1;
}
function d2j(jdn) {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy, 3, r.march);
  let k = jdn - jdn1f, jm, jd;
  if (k >= 0) {
    if (k <= 185) { jm = 1 + jDiv(k, 31); jd = jMod(k, 31) + 1; return { jy, jm, jd }; }
    k -= 186;
  } else {
    jy -= 1; k += 179;
    if (r.leap === 1) k += 1;
  }
  jm = 7 + jDiv(k, 30);
  jd = jMod(k, 30) + 1;
  return { jy, jm, jd };
}
function toJalaali(gy, gm, gd) { return d2j(g2d(gy, gm, gd)); }
function toGregorian(jy, jm, jd) { return d2g(j2d(jy, jm, jd)); }
function isLeapJalaaliYear(jy) { return jalCal(jy).leap === 0; }
function jalaaliMonthLength(jy, jm) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isLeapJalaaliYear(jy) ? 30 : 29;
}

/* ========================= نام ماه‌ها و روزهای هفته ========================= */

const JALALI_MONTHS_FA = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
const JALALI_MONTHS_EN = ['Farvardin', 'Ordibehesht', 'Khordad', 'Tir', 'Mordad', 'Shahrivar', 'Mehr', 'Aban', 'Azar', 'Dey', 'Bahman', 'Esfand'];
const GREG_MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const GREG_MONTHS_FA = ['ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن', 'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'];
const WEEKDAY_FA = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
const WEEKDAY_FA_SHORT = ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'];
const WEEKDAY_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAY_EN_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function gregParts(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? { y: +m[1], m: +m[2], d: +m[3] } : null;
}
function gregMonthName(m, lang) {
  const l = lang || CURRENT.locale;
  return (l === 'fa' ? GREG_MONTHS_FA : GREG_MONTHS_EN)[m - 1] || String(m);
}
function calDateFromISO(iso, calendar) {
  if (calendar === 'jalali') {
    const j = Cal.isoToJ(iso);
    if (!j) return null;
    const g = Cal.jToG(j.jy, j.jm, j.jd);
    return Cal.dateAtNoon(g.gy, g.gm, g.gd);
  }
  const p = gregParts(iso);
  return p ? Cal.dateAtNoon(p.y, p.m, p.d) : null;
}

/* ========================= سرویس تقویم (Cal) ========================= */

const Cal = {
  api: null,
  appRef: null,

  refresh(app) {
    this.api = null;
    try {
      let plug = null;
      try { plug = app.plugins.getPlugin('persian-calendar'); } catch (e) { /* noop */ }
      if (!plug && app.plugins && app.plugins.plugins) plug = app.plugins.plugins['persian-calendar'];
      const cand = (plug && typeof plug === 'object') ? (plug.api || plug) : null;
      if (cand
        && typeof cand.jalaliToGregorian === 'function'
        && typeof cand.gregorianToJalali === 'function') {
        this.api = cand;
      }
    } catch (e) { this.api = null; }
    return !!this.api;
  },
  ensure(app) {
    if (this.api) return true;
    const a = app || this.appRef;
    return a ? this.refresh(a) : false;
  },
  hasApi() { return !!this.api; },

  toFa(s) {
    if (this.api && typeof this.api.toFaNumber === 'function') {
      try { return this.api.toFaNumber(String(s)); } catch (e) { /* noop */ }
    }
    return String(s).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
  },

  jToG(jy, jm, jd) {
    if (this.api) {
      try {
        const g = this.api.jalaliToGregorian(jy, jm, jd);
        if (g && [g.gy, g.gm, g.gd].every((v) => Number.isFinite(v))) {
          return { gy: g.gy, gm: g.gm, gd: g.gd };
        }
      } catch (e) { /* noop */ }
    }
    return toGregorian(jy, jm, jd);
  },
  gToJ(gy, gm, gd) {
    if (this.api) {
      try {
        const j = this.api.gregorianToJalali(gy, gm, gd);
        if (j && [j.jy, j.jm, j.jd].every((v) => Number.isFinite(v))) {
          return { jy: j.jy, jm: j.jm, jd: j.jd };
        }
      } catch (e) { /* noop */ }
    }
    return toJalaali(gy, gm, gd);
  },
  isoToJ(iso) {
    const ms = parseISO(iso);
    if (ms === null) return null;
    const d = new Date(ms);
    try { return this.gToJ(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()); }
    catch (e) { return null; }
  },
  jToISO(jy, jm, jd) {
    const g = this.jToG(jy, jm, jd);
    return g.gy + '-' + pad2(g.gm) + '-' + pad2(g.gd);
  },

  monthLen(jy, jm) {
    const ny = jm === 12 ? jy + 1 : jy;
    const nm = jm === 12 ? 1 : jm + 1;
    try {
      const a = this.jToG(jy, jm, 1);
      const b = this.jToG(ny, nm, 1);
      const len = Math.round(
        (Date.UTC(b.gy, b.gm - 1, b.gd) - Date.UTC(a.gy, a.gm - 1, a.gd)) / 86400000);
      if (len >= 29 && len <= 31) return len;
    } catch (e) { /* noop */ }
    return jalaaliMonthLength(jy, jm);
  },
  monthName(jm, lang) {
    const l = lang || CURRENT.locale;
    if (this.api && typeof this.api.jalaliMonthName === 'function') {
      try {
        const s = this.api.jalaliMonthName(jm, l === 'en' ? 'en' : undefined);
        if (typeof s === 'string' && s) return s;
      } catch (e) { /* noop */ }
    }
    return (l === 'en' ? JALALI_MONTHS_EN : JALALI_MONTHS_FA)[jm - 1] || String(jm);
  },
  weekdayName(jsDay, lang, short) {
    const l = lang || CURRENT.locale;
    const idx = ((jsDay % 7) + 7) % 7;
    if (l === 'en') return (short ? WEEKDAY_EN_SHORT : WEEKDAY_EN)[idx];
    return (short ? WEEKDAY_FA_SHORT : WEEKDAY_FA)[idx];
  },
  dateAtNoon(gy, gm, gd) { return new Date(Date.UTC(gy, gm - 1, gd, 12)); },

  isHoliday(dateObj) {
    if (!this.api || typeof this.api.checkHoliday !== 'function') return false;
    try { return this.api.checkHoliday(dateObj) === true; } catch (e) { return false; }
  },
  eventsOf(dateObj) {
    if (!this.api || typeof this.api.dateToEvents !== 'function') return [];
    try {
      const evs = this.api.dateToEvents(dateObj);
      if (!Array.isArray(evs)) return [];
      return evs.map((ev) => {
        if (!ev) return '';
        const ti = ev.title;
        if (typeof ti === 'string') return ti;
        if (ti && typeof ti === 'object') {
          return (CURRENT.locale === 'fa' ? (ti.fa || ti.en) : (ti.en || ti.fa)) || '';
        }
        return '';
      }).filter(Boolean);
    } catch (e) { return []; }
  },
};

/* ========================= قالب‌بندی ========================= */

class Fmt {
  constructor(getSettings) { this.get = getSettings; }
  get s() { return this.get(); }
  get fa() { return this.s.locale === 'fa'; }

  num(n) {
    try {
      return n.toLocaleString(this.fa ? 'fa-IR' : 'en-US', { maximumFractionDigits: 2 });
    } catch (e) {
      return localizeDigits(n.toLocaleString('en-US'), this.fa);
    }
  }
  currencyLabel() {
  const c = CURRENCIES.find((x) => x.code === this.s.currency);
  if (!c) return this.s.currency;
  return this.fa ? c.labelFa : c.label;
}
currencySymbol() {
  const c = CURRENCIES.find((x) => x.code === this.s.currency);
  return c && c.symbol ? c.symbol : '';
}
  amount(n, withCurrency) {
    if (withCurrency === undefined) withCurrency = true;
    const body = this.num(Math.abs(n));
    const sign = n < 0 ? '−' : '';
    return sign + body + (withCurrency ? ' ' + this.currencyLabel() : '');
  }
  date(iso) {
    if (!iso) return '—';
    if (this.s.calendar === 'jalali') {
      const j = Cal.isoToJ(iso);
      if (j) {
        return localizeDigits(String(j.jd), this.fa) + ' ' +
          Cal.monthName(j.jm) + ' ' + localizeDigits(String(j.jy), this.fa);
      }
      return iso;
    }
    const ms = parseISO(iso);
    if (ms === null) return iso;
    const d = new Date(ms);
    const fmt = this.s.dateFormat || 'YYYY-MM-DD';
    const out = fmt
      .replace('YYYY', String(d.getUTCFullYear()))
      .replace('MMM', d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }))
      .replace('MM', pad2(d.getUTCMonth() + 1))
      .replace('DD', pad2(d.getUTCDate()));
    return localizeDigits(out, this.fa);
  }
  /** برای جدول یادداشت — همیشه شمسی اگر تقویم شمسی باشد */
  dateForNote(iso) {
    return this.date(iso);
  }
}

/* ========================= موتور حسابداری ========================= */

const isOrigin = (tx) => tx.type === 'receivable' || tx.type === 'debt';
const chronological = (a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt;

function computeBalances(data) {
  const map = new Map();
  for (const p of data.people) {
    map.set(p.id, {
      person: p,
      totalReceivable: 0, totalDebt: 0, totalReceived: 0, totalPaid: 0,
      remainingReceivable: 0, remainingDebt: 0, net: 0, txCount: 0, lastActivity: 0,
    });
  }
  for (const tx of data.transactions) {
    const b = map.get(tx.personId);
    if (!b) continue;
    b.txCount += 1;
    b.lastActivity = Math.max(b.lastActivity, tx.createdAt);
    switch (tx.type) {
      case 'receivable': b.totalReceivable += tx.amount; break;
      case 'debt': b.totalDebt += tx.amount; break;
      case 'payment_received': b.totalReceived += tx.amount; break;
      case 'payment_made': b.totalPaid += tx.amount; break;
    }
  }
  for (const b of map.values()) {
    b.remainingReceivable = b.totalReceivable - b.totalReceived;
    b.remainingDebt = b.totalDebt - b.totalPaid;
    b.net = b.remainingReceivable - b.remainingDebt;
  }
  return map;
}

function allocate(originList, paymentList) {
  const origins = [...originList].sort(chronological);
  const payments = [...paymentList].sort(chronological);
  const open = new Map(origins.map((o) => [o.id, o.amount]));
  const allocated = new Map();
  const give = (id, v) => allocated.set(id, (allocated.get(id) || 0) + v);

  const queue = [];
  for (const p of payments) {
    let rest = p.amount;
    if (p.linkedTo && open.has(p.linkedTo)) {
      const take = Math.min(open.get(p.linkedTo), rest);
      if (take > 0) {
        open.set(p.linkedTo, open.get(p.linkedTo) - take);
        give(p.linkedTo, take);
        rest -= take;
      }
    }
    if (rest > EPS) queue.push(rest);
  }
  let qi = 0;
  for (const o of origins) {
    let need = open.get(o.id);
    while (need > EPS && qi < queue.length) {
      const take = Math.min(queue[qi], need);
      queue[qi] -= take;
      need -= take;
      give(o.id, take);
      if (queue[qi] <= EPS) qi += 1;
    }
    open.set(o.id, need);
  }
  return allocated;
}

function dueInfoFor(dueDate, today, soonDays) {
  if (!dueDate) return null;
  const days = diffDays(today, dueDate);
  const nStr = (n) => localizeDigits(String(n), CURRENT.locale === 'fa');
  if (days < 0) return { kind: 'overdue', days, label: days === -1 ? t('dueOverdue1') : t('dueOverdueN', { n: nStr(-days) }) };
  if (days === 0) return { kind: 'today', days, label: t('dueToday') };
  if (days === 1) return { kind: 'soon', days, label: t('dueTomorrow') };
  if (days <= soonDays) return { kind: 'soon', days, label: t('dueInN', { n: nStr(days) }) };
  return { kind: 'future', days, label: '' };
}

function computeTxStates(data, today, soonDays) {
  const states = new Map();
  const groups = new Map();
  const groupOf = (key) => {
    let g = groups.get(key);
    if (!g) { g = { origins: [], payments: [] }; groups.set(key, g); }
    return g;
  };
  for (const tx of data.transactions) if (isOrigin(tx)) groupOf(tx.personId + '|' + tx.type).origins.push(tx);
  for (const tx of data.transactions) {
    if (tx.type === 'payment_received') groupOf(tx.personId + '|receivable').payments.push(tx);
    else if (tx.type === 'payment_made') groupOf(tx.personId + '|debt').payments.push(tx);
  }
  for (const g of groups.values()) {
    const alloc = allocate(g.origins, g.payments);
    for (const o of g.origins) {
      const allocAmt = alloc.get(o.id) || 0;
      const remaining = Math.round((o.amount - allocAmt) * 100) / 100;
      const status = remaining <= EPS ? 'settled' : allocAmt > EPS ? 'partial' : 'open';
      const due = status === 'settled' ? null : dueInfoFor(o.dueDate, today, soonDays);
      states.set(o.id, { allocated: allocAmt, remaining, status, due });
    }
  }
  return states;
}

function computeLedger(data, today, dueSoonDays) {
  const balances = computeBalances(data);
  const states = computeTxStates(data, today, dueSoonDays);
  const stats = {
    totalReceivables: 0, totalDebts: 0, net: 0,
    peopleCount: data.people.length, unpaidCount: 0, settledCount: 0,
    overdueCount: 0, dueSoonCount: 0,
  };
  for (const b of balances.values()) {
    stats.totalReceivables += b.remainingReceivable;
    stats.totalDebts += b.remainingDebt;
    if (b.remainingReceivable > EPS || b.remainingDebt > EPS) stats.unpaidCount += 1;
    else if (b.txCount > 0) stats.settledCount += 1;
  }
  stats.net = stats.totalReceivables - stats.totalDebts;
  const names = new Map(data.people.map((p) => [p.id, p.name]));
  const attention = [];
  for (const tx of data.transactions) {
    const st = states.get(tx.id);
    if (!st || !st.due) continue;
    const k = st.due.kind;
    if (k === 'overdue') stats.overdueCount += 1;
    else if (k === 'today' || k === 'soon') stats.dueSoonCount += 1;
    if (k !== 'future') attention.push({ tx, personName: names.get(tx.personId) || '?', due: st.due, remaining: st.remaining });
  }
  attention.sort((a, b) => a.due.days - b.due.days || a.tx.date.localeCompare(b.tx.date));
  return { balances, states, stats, attention };
}

/* ========================= ذخیره‌سازی (data.json پلاگین) ========================= */

const HEADER =
   'این فایل توسط پلاگین «حساب‌های شخصی» ساخته می‌شود و فقط گزارش خوانا است.\n' +
  'داده‌های اصلی در data.json پلاگین ذخیره می‌شوند.\n';

function emptyData() {
  return { version: DATA_VERSION, people: [], transactions: [], counters: { trx: 0 } };
}

function optString(v) {
  const s = typeof v === 'string' ? v.trim() : '';
  return s || undefined;
}
function toNum(v, fallback) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function sanitizeData(raw) {
  const src = (raw && typeof raw === 'object') ? raw : {};
  const data = emptyData();
  const seen = new Set();
  for (const p of Array.isArray(src.people) ? src.people : []) {
    if (!p || typeof p !== 'object') continue;
    const id = optString(p.id) || randomId('p');
    if (seen.has(id)) continue;
    seen.add(id);
    data.people.push({
      id,
      name: optString(p.name) || 'بی‌نام',
      phone: optString(p.phone),
      email: optString(p.email),
      notes: optString(p.notes),
      tags: Array.isArray(p.tags) ? p.tags.map((x) => String(x)) : [],
      createdAt: toNum(p.createdAt, Date.now()),
      updatedAt: toNum(p.updatedAt, Date.now()),
    });
  }
  for (const tx of Array.isArray(src.transactions) ? src.transactions : []) {
    if (!tx || typeof tx !== 'object') continue;
    const type = VALID_TYPES.includes(tx.type) ? tx.type : null;
    const amount = toNum(tx.amount, NaN);
    if (!type || !Number.isFinite(amount) || amount < 0) continue;
    const origin = type === 'receivable' || type === 'debt';
    data.transactions.push({
      id: optString(tx.id) || randomId('t'),
      personId: optString(tx.personId) || '',
      type,
      amount: Math.abs(amount),
      date: ISO_RE.test(tx.date || '') ? tx.date : todayISO(),
      description: optString(tx.description),
      category: optString(tx.category),
      dueDate: origin && ISO_RE.test(tx.dueDate || '') ? tx.dueDate : undefined,
      notes: optString(tx.notes),
      linkedTo: origin ? undefined : optString(tx.linkedTo),
      createdAt: toNum(tx.createdAt, Date.now()),
      updatedAt: toNum(tx.updatedAt, Date.now()),
    });
  }
  let maxTrx = 0;
  for (const tx of data.transactions) maxTrx = Math.max(maxTrx, trxNumberFromId(tx.id));
  data.counters = { trx: Math.max(toNum(src.counters ? src.counters.trx : 0, 0), maxTrx) };
  return data;
}

/* ========================= کلاس ذخیره‌سازی ========================= */

class PluginDataStore {
  constructor(app, getSettings, fmt, plugin) {
    this.app = app;
    this.getSettings = getSettings;
    this.fmt = fmt;
    this.plugin = plugin;
  }
  get settings() { return this.getSettings(); }

  async load() {
    const raw = (await this.plugin.loadData()) || {};
    // اگر داده‌ها در data.json پلاگین هستند (ساختار جدید)
    if (raw && (Array.isArray(raw.people) || Array.isArray(raw.transactions))) {
      return sanitizeData(raw);
    }
    // اگر data.json فقط تنظیمات دارد، از یادداشت قدیمی مهاجرت کن
    return await this.migrateFromNote();
  }

  async save(data) {
    const current = (await this.plugin.loadData()) || {};
    const merged = Object.assign({}, current, {
      people: data.people,
      transactions: data.transactions,
      counters: data.counters,
      version: data.version,
    });
    await this.plugin.saveData(merged);
    if (this.settings.showLedgerInFile) {
      await this.writeReadableNote(data);
    }
  }

  async writeReadableNote(data) {
    try {
      const path = normalizePath((this.settings.filePath || '').trim() || DEFAULT_FILE_PATH);
      let file = this.app.vault.getAbstractFileByPath(path);
      const body = HEADER + '\n' + renderReadableLedger(data, this.fmt) + '\n';
      if (file instanceof TFile) {
        await this.app.vault.modify(file, body);
      } else if (!file) {
        await this.app.vault.create(path, body);
      }
    } catch (e) { /* بی‌صدا */ }
  }

  async migrateFromNote() {
    try {
      const path = normalizePath((this.settings.filePath || '').trim() || DEFAULT_FILE_PATH);
      const file = this.app.vault.getAbstractFileByPath(path);
      if (!(file instanceof TFile)) return emptyData();
      const content = await this.app.vault.read(file);
      // تلاش برای خواندن JSON قدیمی
      const jsonMatch = /```json\s*([\s\S]*?)```/.exec(content);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          const clean = sanitizeData(parsed);
          await this.save(clean);
          return clean;
        } catch (e) { /* noop */ }
      }
    } catch (e) { /* noop */ }
    return emptyData();
  }
}

/* ========================= رندر جدول خوانا ========================= */

function mdEscape(s) { return String(s).replace(/\|/g, '\\|').replace(/\n/g, ' '); }

function renderReadableLedger(data, fmt) {
  const balances = computeBalances(data);
  const nameOf = new Map(data.people.map((p) => [p.id, p.name]));
  const lines = [];
  lines.push('### ' + t('ledgerPeopleH'), '');
  lines.push('| ' + [t('thPerson'), t('thPhone'), t('thRec'), t('thDebt'), t('thNet')].join(' | ') + ' |', '|---|---|---:|---:|---:|');
  for (const p of data.people) {
    const b = balances.get(p.id);
    lines.push('| ' + [
      mdEscape(p.name), mdEscape(p.phone || ''),
      b.remainingReceivable ? fmt.num(b.remainingReceivable) : '—',
      b.remainingDebt ? fmt.num(b.remainingDebt) : '—',
      fmt.num(b.net),
    ].join(' | ') + ' |');
  }
  lines.push('', '### ' + t('ledgerTxH'), '');
  lines.push('| ' + [t('thId'), t('thDate'), t('thPerson'), t('thType'), t('thAmount'), t('thDesc')].join(' | ') + ' |', '|---|---|---|---|---:|---|');
  const txs = [...data.transactions].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
  for (const tx of txs) {
    lines.push('| ' + [
      tx.id, fmt.dateForNote(tx.date), mdEscape(nameOf.get(tx.personId) || '?'),
      typeLabel(tx.type), fmt.num(tx.amount), mdEscape(tx.description || tx.notes || ''),
    ].join(' | ') + ' |');
  }
  return lines.join('\n');
}

/* ========================= عملیات داده ========================= */

function addPerson(data, input) {
  const now = Date.now();
  const person = {
    id: randomId('p'),
    name: input.name.trim(),
    phone: (input.phone || '').trim() || undefined,
    email: (input.email || '').trim() || undefined,
    notes: (input.notes || '').trim() || undefined,
    tags: (input.tags || []).map((x) => x.trim()).filter(Boolean),
    createdAt: now, updatedAt: now,
  };
  data.people.push(person);
  return person;
}
function findPersonByName(data, name) {
  const q = name.trim().toLowerCase();
  return data.people.find((p) => p.name.trim().toLowerCase() === q);
}
function updatePerson(data, id, patch) {
  const p = data.people.find((x) => x.id === id);
  if (!p) return;
  if (patch.name !== undefined && patch.name.trim()) p.name = patch.name.trim();
  if (patch.phone !== undefined) p.phone = (patch.phone || '').trim() || undefined;
  if (patch.email !== undefined) p.email = (patch.email || '').trim() || undefined;
  if (patch.notes !== undefined) p.notes = (patch.notes || '').trim() || undefined;
  if (patch.tags !== undefined) p.tags = patch.tags.map((x) => x.trim()).filter(Boolean);
  p.updatedAt = Date.now();
}
function deletePerson(data, id) {
  data.people = data.people.filter((p) => p.id !== id);
  data.transactions = data.transactions.filter((tx) => tx.personId !== id);
}
function nextTrxId(data) {
  let n = Math.max(0, data.counters.trx | 0);
  for (const tx of data.transactions) {
    const v = trxNumberFromId(tx.id);
    if (v > n) n = v;
  }
  const used = new Set(data.transactions.map((x) => x.id));
  let id;
  do { n += 1; id = 'TRX-' + String(n).padStart(5, '0'); } while (used.has(id));
  data.counters.trx = n;
  return id;
}
function addTransaction(data, input) {
  const origin = input.type === 'receivable' || input.type === 'debt';
  const tx = {
    id: nextTrxId(data),
    personId: input.personId,
    type: input.type,
    amount: Math.abs(input.amount),
    date: ISO_RE.test(input.date || '') ? input.date : todayISO(),
    description: (input.description || '').trim() || undefined,
    category: (input.category || '').trim() || undefined,
    dueDate: origin && ISO_RE.test(input.dueDate || '') ? input.dueDate : undefined,
    notes: (input.notes || '').trim() || undefined,
    linkedTo: origin ? undefined : (input.linkedTo || undefined),
    createdAt: Date.now(), updatedAt: Date.now(),
  };
  data.transactions.push(tx);
  return tx;
}
function updateTransaction(data, id, patch) {
  const tx = data.transactions.find((x) => x.id === id);
  if (!tx) return;
  if (patch.type) tx.type = patch.type;
  if (patch.amount !== undefined && Number.isFinite(patch.amount)) tx.amount = Math.abs(patch.amount);
  if (patch.date && ISO_RE.test(patch.date)) tx.date = patch.date;
  if (patch.description !== undefined) tx.description = (patch.description || '').trim() || undefined;
  if (patch.category !== undefined) tx.category = (patch.category || '').trim() || undefined;
  if (patch.notes !== undefined) tx.notes = (patch.notes || '').trim() || undefined;
  if (patch.personId) tx.personId = patch.personId;
  const origin = tx.type === 'receivable' || tx.type === 'debt';
  if (!origin) {
    tx.dueDate = undefined;
    if (patch.linkedTo !== undefined) tx.linkedTo = patch.linkedTo || undefined;
  } else {
    tx.linkedTo = undefined;
    if (patch.dueDate !== undefined) {
      tx.dueDate = patch.dueDate && ISO_RE.test(patch.dueDate) ? patch.dueDate : undefined;
    }
  }
  tx.updatedAt = Date.now();
}
function deleteTransaction(data, id) {
  data.transactions = data.transactions.filter((tx) => tx.id !== id);
  for (const tx of data.transactions) if (tx.linkedTo === id) tx.linkedTo = undefined;
}

/* ========================= Store ========================= */

class AccountsStore {
  constructor(plugin) {
    this.plugin = plugin;
    this.data = emptyData();
    this.ledger = null;
    this.error = null;
    this.loaded = false;
    this.listeners = new Set();
  }
  get fmt() { return this.plugin.fmt; }
  get categories() { return this.plugin.settings.categories; }
  get confirmDelete() { return this.plugin.settings.confirmDelete; }
  personName(id) {
    const p = this.data.people.find((x) => x.id === id);
    return p ? p.name : '?';
  }
  subscribe(fn) { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; }
  emit() { for (const fn of [...this.listeners]) fn(); }
  recompute() {
    this.ledger = computeLedger(this.data, todayISO(), this.plugin.settings.dueSoonDays);
  }
  async reload() {
    this.error = null;
    try { this.data = await this.plugin.repo.load(); }
    catch (e) { this.error = e instanceof Error ? e.message : String(e); }
    this.loaded = true;
    this.recompute();
    this.emit();
  }
  async ready() { if (!this.loaded) await this.reload(); }
  async persist() {
    try {
      await this.plugin.repo.save(this.data);
      this.error = null;
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e);
      new Notice('⚠ ' + this.error);
    }
    this.recompute();
    this.emit();
  }

  async ensurePerson(name) {
    await this.ready();
    return findPersonByName(this.data, name) || addPerson(this.data, { name });
  }
  async addPerson(input) { await this.ready(); const p = addPerson(this.data, input); await this.persist(); return p; }
  async updatePerson(id, patch) { await this.ready(); updatePerson(this.data, id, patch); await this.persist(); }
  async deletePerson(id) { await this.ready(); deletePerson(this.data, id); await this.persist(); }

  async addTransaction(input) { await this.ready(); const tx = addTransaction(this.data, input); await this.persist(); return tx; }
  async updateTransaction(id, patch) { await this.ready(); updateTransaction(this.data, id, patch); await this.persist(); }
  async deleteTransaction(id) { await this.ready(); deleteTransaction(this.data, id); await this.persist(); }

  async settleTransaction(txId) {
    await this.ready();
    const tx = this.data.transactions.find((x) => x.id === txId);
    const st = this.ledger ? this.ledger.states.get(txId) : null;
    if (!tx || !st || st.remaining <= EPS) return;
    await this.addTransaction({
      personId: tx.personId,
      type: tx.type === 'receivable' ? 'payment_received' : 'payment_made',
      amount: st.remaining,
      date: todayISO(),
      description: t('settleFor', { id: tx.id }) + (tx.description ? ' (' + tx.description + ')' : ''),
      category: tx.category,
      linkedTo: tx.id,
    });
  }
  async settlePerson(personId) {
    await this.ready();
    const b = this.ledger ? this.ledger.balances.get(personId) : null;
    if (!b) return;
    if (b.remainingReceivable > EPS) {
      addTransaction(this.data, {
        personId, type: 'payment_received', amount: b.remainingReceivable,
        date: todayISO(), description: t('accountSettlement'),
      });
    }
    if (b.remainingDebt > EPS) {
      addTransaction(this.data, {
        personId, type: 'payment_made', amount: b.remainingDebt,
        date: todayISO(), description: t('accountSettlement'),
      });
    }
    await this.persist();
  }
  async resetEmpty() { this.data = emptyData(); await this.persist(); }
}

/* ========================= تنظیمات ========================= */

const DEFAULT_SETTINGS = {
  filePath: DEFAULT_FILE_PATH,
  currency: 'usd',
  locale: 'en',
  calendar: 'gregorian',
  dateFormat: 'YYYY-MM-DD',
  dueSoonDays: 7,
  categories: [...DEFAULT_CATEGORIES],
  compact: false,
  confirmDelete: true,
  openAfterAdd: false,
  showLedgerInFile: true,
  settingsVersion: 2,
};class PASettingTab extends PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.toggleClass('pa-rtl-modal', CURRENT.locale === 'fa');
    const s = this.plugin.settings;
    const save = async (fn) => { fn(); await this.plugin.saveSettings(); };

    // ۱) زبان
    containerEl.createEl('h3', { text: t('setLang') });
    new Setting(containerEl).setName(t('setLang')).addDropdown((d) => {
      d.addOption('fa', 'فارسی');
      d.addOption('en', 'English');
      d.setValue(s.locale);
      d.onChange((v) => {
        save(() => { s.locale = v; }).then(() => this.display());
      });
    });

    // ۲) واحد پول
    new Setting(containerEl).setName(t('setCurrency')).setDesc(t('setCurrencyDesc')).addDropdown((d) => {
      const fa = CURRENT.locale === 'fa';
      for (const c of CURRENCIES) d.addOption(c.code, fa ? c.labelFa : c.label);
      d.setValue(s.currency);
      d.onChange((v) => save(() => { s.currency = v; }));
    });

    // ۳) ذخیره‌سازی
    containerEl.createEl('h3', { text: t('setStorage') });
    new Setting(containerEl)
      .setName(t('setCentralFile'))
      .setDesc(t('setCentralFileDesc'))
      .addText((tx) => tx.setPlaceholder(DEFAULT_FILE_PATH).setValue(s.filePath).onChange((v) =>
        save(() => { s.filePath = v.trim() || DEFAULT_FILE_PATH; })))
      .addButton((b) => b.setButtonText(t('openFile')).onClick(async () => {
        try {
          const path = normalizePath((s.filePath || '').trim() || DEFAULT_FILE_PATH);
          let file = this.app.vault.getAbstractFileByPath(path);
          if (!(file instanceof TFile)) {
            await this.plugin.repo.writeReadableNote(this.plugin.accounts.data);
            file = this.app.vault.getAbstractFileByPath(path);
          }
          if (file instanceof TFile) await this.app.workspace.getLeaf('tab').openFile(file);
        } catch (e) { new Notice(String(e instanceof Error ? e.message : e)); }
      }));

    new Setting(containerEl).setName(t('setLedger')).setDesc(t('setLedgerDesc')).addToggle((tg) =>
      tg.setValue(s.showLedgerInFile).onChange(async (v) => {
        s.showLedgerInFile = v;
        await this.plugin.saveSettings();
        if (v) await this.plugin.repo.writeReadableNote(this.plugin.accounts.data);
      }));

    // ۴) پشتیبان‌گیری
    containerEl.createEl('h3', { text: t('setBackup') });
    new Setting(containerEl)
      .setName(t('setExportJSON'))
      .setDesc(t('setExportJSONDesc'))
      .addButton((b) => b.setButtonText(t('exportBtn')).onClick(async () => {
        try {
          const json = JSON.stringify(this.plugin.accounts.data, null, 2);
          const blob = new Blob([json], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'personal-accounts-' + new Date().toISOString().slice(0, 10) + '.json';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          new Notice(t('exportDone'));
        } catch (e) {
          new Notice('⚠ ' + (e instanceof Error ? e.message : String(e)));
        }
      }));

    new Setting(containerEl)
      .setName(t('setImportJSON'))
      .setDesc(t('setImportJSONDesc'))
      .addButton((b) => b.setButtonText(t('importBtn')).onClick(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.onchange = async (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          try {
            const text = await file.text();
            const parsed = JSON.parse(text);
            const clean = sanitizeData(parsed);
            this.plugin.accounts.data = clean;
            await this.plugin.accounts.persist();
            new Notice(t('importDone'));
          } catch (err) {
            new Notice('⚠ ' + t('importError') + ': ' + (err instanceof Error ? err.message : String(err)));
          }
        };
        input.click();
      }));

    // ۵) تقویم
    new Setting(containerEl).setName(t('setCalendar')).setDesc(t('setCalendarDesc')).addDropdown((d) => {
      d.addOption('jalali', t('calJalali'));
      d.addOption('gregorian', t('calGregorian'));
      d.setValue(s.calendar);
      d.onChange((v) => save(() => { s.calendar = v; }));
    });

    // ۶) قالب تاریخ
    new Setting(containerEl).setName(t('setDateFormat')).setDesc(t('setDateFormatDesc'))
      .addText((tx) => tx.setValue(s.dateFormat).onChange((v) => save(() => { s.dateFormat = v; })));

    // ۷) نمایش فشرده
    new Setting(containerEl).setName(t('setCompact')).addToggle((tg) =>
      tg.setValue(s.compact).onChange((v) => save(() => { s.compact = v; })));

    // ۸) دسته‌بندی‌ها
    containerEl.createEl('h3', { text: t('setCategories') });
    new Setting(containerEl).setName(t('setCategories')).setDesc(t('setCategoriesDesc')).addTextArea((tx) => {
      tx.setValue(s.categories.join('\n')).onChange((v) =>
        save(() => { s.categories = v.split('\n').map((x) => x.trim()).filter(Boolean); }));
      tx.inputEl.rows = 7;
    });

    // ۹) تأیید قبل از حذف
    containerEl.createEl('h3', { text: t('setConfirmDel') });
    new Setting(containerEl).setName(t('setDueSoon')).addText((tx) =>
      tx.setValue(String(s.dueSoonDays)).onChange((v) => {
        const n = parseInt(v, 10);
        if (!Number.isNaN(n) && n >= 0) save(() => { s.dueSoonDays = n; });
      }));
    new Setting(containerEl).setName(t('setConfirmDel')).addToggle((tg) =>
      tg.setValue(s.confirmDelete).onChange((v) => save(() => { s.confirmDelete = v; })));
    new Setting(containerEl).setName(t('setOpenAfterAdd')).addToggle((tg) =>
      tg.setValue(s.openAfterAdd).onChange((v) => save(() => { s.openAfterAdd = v; })));

    // ===== درباره / تبلیغات =====
    const lang = CURRENT.locale;

    containerEl.createEl('h3', {
      text: lang === 'fa' ? 'درباره' : 'About',
    });

    const wrap = containerEl.createDiv({ cls: 'uts-channel-promo-wrap' });

    const channels = [
      {
        id: 'bale',
        label: lang === 'fa' ? 'کانال بله' : 'Bale Channel',
        handle: '@obsidiantut',
        url: 'https://ble.ir/obsidiantut',
        color: '#22A06B',
        svg: `<svg viewBox="0 0 64 64" width="20" height="20" aria-hidden="true"><defs><linearGradient id="hmBaleGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#3ED598"/><stop offset="100%" stop-color="#22A06B"/></linearGradient></defs><circle cx="32" cy="32" r="30" fill="url(#hmBaleGrad)"/><path d="M20 33 L28 41 L46 23" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      },
      {
        id: 'telegram',
        label: lang === 'fa' ? 'کانال تلگرام' : 'Telegram Channel',
        handle: '@obsidiantut',
        url: 'https://t.me/obsidiantut',
        color: '#229ED9',
        svg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>`,
      },
      {
        id: 'youtube',
        label: lang === 'fa' ? 'کانال یوتیوب' : 'YouTube Channel',
        handle: '@obsidiantut',
        url: 'https://youtube.com/@obsidiantut',
        color: '#FF0000',
        svg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z"/></svg>`,
      },
    ];

    for (const ch of channels) {
      const a = wrap.createEl('a', {
        cls: 'uts-channel-card',
        href: ch.url,
      });
      a.setAttr('target', '_blank');
      a.setAttr('rel', 'noopener noreferrer');
      a.style.setProperty('--uts-channel-color', ch.color);

      const iconWrap = a.createDiv({ cls: 'uts-channel-icon' });
      iconWrap.innerHTML = ch.svg;

      const meta = a.createDiv({ cls: 'uts-channel-meta' });
      meta.createDiv({ cls: 'uts-channel-label', text: ch.label });
      meta.createDiv({ cls: 'uts-channel-handle', text: ch.handle });

      const arrow = a.createDiv({ cls: 'uts-channel-arrow' });
      setIcon(arrow, 'arrow-up-right');
    }
  }
}
/* ========================= اجزای UI ========================= */

function iconButton(name, title, onClick) {
  const b = el('button', 'pa-btn small icon');
  b.title = title;
  setIcon(b, name);
  b.addEventListener('click', onClick);
  return b;
}
function dueChip(due, fallbackLabel) {
  return el('span', 'pa-chip' + (due.kind === 'future' ? '' : ' ' + due.kind), due.label || fallbackLabel);
}
function modalRtl(modal) {
  if (CURRENT.locale === 'fa') modal.modalEl.addClass('pa-rtl-modal');
}
function inputText(placeholder) {
  const i = el('input');
  i.type = 'text';
  if (placeholder) i.placeholder = placeholder;
  return i;
}
function field(parent, label, input) {
  const w = parent.createDiv('pa-field');
  w.createEl('label').setText(label);
  w.appendChild(input);
  return w;
}

/* ========================= انتخابگر تاریخ ========================= */

let activePicker = null;
function closeActivePicker() {
  if (activePicker) {
    const p = activePicker;
    activePicker = null;
    try { p.close(); } catch (e) { /* noop */ }
  }
}

const jalaliAdapter = {
  todayParts() {
    const j = Cal.isoToJ(todayISO());
    return j ? { y: j.jy, m: j.jm, d: j.jd } : { y: 1404, m: 1, d: 1 };
  },
  fromISO(iso) {
    const j = Cal.isoToJ(iso);
    return j ? { y: j.jy, m: j.jm, d: j.jd } : null;
  },
  toISO(p) { return Cal.jToISO(p.y, p.m, p.d); },
  monthName(m) { return Cal.monthName(m); },
  monthLen(y, m) { return Cal.monthLen(y, m); },
  partsToDate(y, m, d) {
    const g = Cal.jToG(y, m, d);
    return Cal.dateAtNoon(g.gy, g.gm, g.gd);
  },
};

const gregorianAdapter = {
  todayParts() { return gregParts(todayISO()) || { y: 2024, m: 1, d: 1 }; },
  fromISO(iso) { return gregParts(iso); },
  toISO(p) { return p.y + '-' + pad2(p.m) + '-' + pad2(p.d); },
  monthName(m) { return gregMonthName(m); },
  monthLen(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); },
  partsToDate(y, m, d) { return Cal.dateAtNoon(y, m, d); },
};

function createDatePicker(calendar, fa) {
  const A = calendar === 'jalali' ? jalaliAdapter : gregorianAdapter;
  const weekStart = (calendar === 'jalali' || fa) ? 6 : 0;

  const root = el('div', 'pa-datefield');
  const btn = el('button', 'pa-date-btn');
  btn.type = 'button';
  const icon = el('span', 'pa-date-icon');
  setIcon(icon, 'calendar');
  const label = el('span', 'pa-date-label');
  btn.append(icon, label);
  root.appendChild(btn);

  let iso = '';
  let view = null;
  let pop = null;
  let isOpen = false;

  function viewFromISO(v) {
    if (v) {
      const p = A.fromISO(v);
      if (p) return { y: p.y, m: p.m };
    }
    const tp = A.todayParts();
    return { y: tp.y, m: tp.m };
  }

  function displayText() {
    if (!iso) return t('pickDate');
    let shown = iso;
    if (calendar === 'jalali') {
      const j = Cal.isoToJ(iso);
      if (j) shown = localizeDigits(String(j.jd), fa) + ' ' + Cal.monthName(j.jm) + ' ' + localizeDigits(String(j.jy), fa);
    } else {
      const p = gregParts(iso);
      if (p) shown = localizeDigits(String(p.d), fa) + ' ' + gregMonthName(p.m) + ' ' + localizeDigits(String(p.y), fa);
    }
    const wd = isoWeekday(iso);
    return shown + (wd === null ? '' : ' · ' + Cal.weekdayName(wd));
  }

  function syncDisplay() {
    label.textContent = displayText();
    btn.toggleClass('pa-empty-date', !iso);
  }

  function shiftMonths(k) {
    const idx = view.y * 12 + (view.m - 1) + k;
    view = { y: Math.floor(idx / 12), m: ((idx % 12) + 12) % 12 + 1 };
    renderCal();
  }

  function renderCal() {
    if (!pop) return;
    pop.empty();

    const head = el('div', 'pa-cal-head');
    const prevY = el('button', 'pa-cal-nav', '«'); prevY.type = 'button';
    const prevM = el('button', 'pa-cal-nav', '‹'); prevM.type = 'button';
    const title = el('div', 'pa-cal-title', A.monthName(view.m) + ' ' + localizeDigits(String(view.y), fa));
    const nextM = el('button', 'pa-cal-nav', '›'); nextM.type = 'button';
    const nextY = el('button', 'pa-cal-nav', '»'); nextY.type = 'button';
    prevY.onclick = (e) => { e.preventDefault(); e.stopPropagation(); shiftMonths(-12); };
    prevM.onclick = (e) => { e.preventDefault(); e.stopPropagation(); shiftMonths(-1); };
    nextM.onclick = (e) => { e.preventDefault(); e.stopPropagation(); shiftMonths(1); };
    nextY.onclick = (e) => { e.preventDefault(); e.stopPropagation(); shiftMonths(12); };
    head.append(prevY, prevM, title, nextM, nextY);
    pop.appendChild(head);

    const grid = el('div', 'pa-cal-grid');
    for (let i = 0; i < 7; i++) {
      grid.appendChild(el('div', 'pa-cal-wd', Cal.weekdayName((weekStart + i) % 7, CURRENT.locale, true)));
    }
    const first = A.partsToDate(view.y, view.m, 1);
    const firstCol = (first.getUTCDay() - weekStart + 7) % 7;
    for (let i = 0; i < firstCol; i++) grid.appendChild(el('span'));
    const len = A.monthLen(view.y, view.m);
    const todayIsoVal = todayISO();
    for (let d = 1; d <= len; d++) {
      const pISO = A.toISO({ y: view.y, m: view.m, d });
      const dateObj = A.partsToDate(view.y, view.m, d);
      const cls = ['pa-cal-day'];
      if (pISO === todayIsoVal) cls.push('today');
      if (iso && pISO === iso) cls.push('selected');
      const holiday = Cal.isHoliday(dateObj) || ((calendar === 'jalali' || fa) && dateObj.getUTCDay() === 5);
      if (holiday) cls.push('holiday');
      const cell = el('button', cls.join(' '), localizeDigits(String(d), fa));
      cell.type = 'button';
      const evs = Cal.eventsOf(dateObj);
      cell.title = Cal.weekdayName(dateObj.getUTCDay()) + ' ' +
        localizeDigits(view.y + '/' + view.m + '/' + d, fa) +
        (evs.length ? '\n' + evs.join(' • ') : '');
      if (evs.length) cell.appendChild(el('span', 'pa-cal-dot'));
      cell.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        iso = pISO;
        syncDisplay();
        closePop();
      };
      grid.appendChild(cell);
    }
    pop.appendChild(grid);

    const foot = el('div', 'pa-cal-foot');
    const todayBtn = el('button', 'pa-btn small', t('todayBtn'));
    todayBtn.type = 'button';
    todayBtn.onclick = (e) => {
      e.preventDefault(); e.stopPropagation();
      iso = todayIsoVal; view = viewFromISO(iso); syncDisplay(); closePop();
    };
    const clearBtn = el('button', 'pa-btn small', t('clearBtn'));
    clearBtn.type = 'button';
    clearBtn.onclick = (e) => {
      e.preventDefault(); e.stopPropagation();
      iso = ''; syncDisplay(); closePop();
    };
    foot.append(todayBtn, clearBtn);
    pop.appendChild(foot);
  }

  function positionPop() {
    if (!pop) return;
    const r = btn.getBoundingClientRect();
    if ((!r.width && !r.height) || !btn.isConnected) { closePop(); return; }
    const w = pop.offsetWidth || 268;
    const h = pop.offsetHeight || 320;
    let left = r.left;
    if (left + w > window.innerWidth - 8) left = window.innerWidth - w - 8;
    if (left < 8) left = 8;
    let top = r.bottom + 4;
    if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 4);
    pop.style.left = Math.round(left) + 'px';
    pop.style.top = Math.round(top) + 'px';
  }

  const onDocPointer = (e) => {
    if (!isOpen) return;
    if (!btn.isConnected) { closePop(); return; }
    const target = e.target;
    if (target instanceof Node) {
      if (pop && pop.contains(target)) return;
      if (btn.contains(target)) return;
    }
    closePop();
  };
  const onDocKey = (e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      closePop();
    } else if (e.key === 'Tab') {
      closePop();
    }
  };
  const onReposition = () => { if (isOpen) positionPop(); };

  function openPop() {
    if (isOpen) { closePop(); return; }
    closeActivePicker();
    Cal.ensure(Cal.appRef);
    view = viewFromISO(iso);
    pop = el('div', 'pa-cal-pop');
    pop.setAttribute('dir', fa ? 'rtl' : 'ltr');
    renderCal();
    document.body.appendChild(pop);
    pop.style.visibility = 'hidden';
    positionPop();
    pop.style.visibility = '';
    isOpen = true;
    btn.addClass('pa-open');
    activePicker = api;
    document.addEventListener('pointerdown', onDocPointer, true);
    document.addEventListener('mousedown', onDocPointer, true);
    document.addEventListener('keydown', onDocKey, true);
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
  }

  function closePop() {
    if (!isOpen && !pop) return;
    isOpen = false;
    btn.removeClass('pa-open');
    if (pop) { pop.remove(); pop = null; }
    document.removeEventListener('pointerdown', onDocPointer, true);
    document.removeEventListener('mousedown', onDocPointer, true);
    document.removeEventListener('keydown', onDocKey, true);
    window.removeEventListener('resize', onReposition);
    window.removeEventListener('scroll', onReposition, true);
    if (activePicker === api) activePicker = null;
  }

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOpen) closePop();
    else openPop();
  });

  const api = {
    el: root,
    get: () => iso,
    set: (v) => { iso = v || ''; view = viewFromISO(iso); syncDisplay(); },
    close: closePop,
  };
  syncDisplay();
  return api;
}

/* ========================= مودال‌ها ========================= */

class ConfirmModal extends Modal {
  constructor(app, opts) { super(app); this.opts = opts; }
  onOpen() {
    modalRtl(this);
    this.titleEl.setText(this.opts.title);
    for (const line of this.opts.lines) this.contentEl.createDiv('pa-muted').setText(line);
    const actions = this.contentEl.createDiv('pa-actions');
    const cancel = el('button', 'pa-btn', t('cancel'));
    cancel.onclick = () => this.close();
    const ok = el('button', 'pa-btn ' + (this.opts.danger ? 'danger' : 'primary'), this.opts.confirmLabel || t('confirm'));
    ok.onclick = async () => { this.close(); await this.opts.onConfirm(); };
    actions.append(cancel, ok);
  }
  onClose() { this.contentEl.empty(); }
}

class PersonModal extends Modal {
  constructor(app, store, person, opts = {}) {
    super(app);
    this.store = store;
    this.person = person;
    this.opts = opts;
  }
  onOpen() {
    modalRtl(this);
    const p = this.person;
    this.titleEl.setText(p ? t('editPersonTitle') : t('addPersonTitle'));
    const form = this.contentEl.createDiv('pa-form');
    const err = form.createDiv('pa-form-error');
    const fail = (m) => { err.setText(m); err.addClass('show'); };

    const name = inputText(t('phName')); name.value = p ? p.name : '';
    const phone = inputText(t('phPhone')); phone.value = (p && p.phone) || '';
    const email = inputText(t('phEmail')); email.value = (p && p.email) || '';
    const tags = inputText(t('phTags')); tags.value = (p ? p.tags : []).join(', ');
    const notes = document.createElement('textarea');
    notes.rows = 3;
    notes.value = (p && p.notes) || '';

    field(form, t('fName'), name);
    field(form, t('fPhone'), phone);
    field(form, t('fEmail'), email);
    field(form, t('fTags'), tags);
    field(form, t('fNotes'), notes);

    const submit = async () => {
      const n = name.value.trim();
      if (!n) return fail(t('nameRequired'));
      const tagList = tags.value.split(',').map((x) => x.trim()).filter(Boolean);
      const common = {
        phone: phone.value.trim() || undefined,
        email: email.value.trim() || undefined,
        notes: notes.value.trim() || undefined,
        tags: tagList,
      };
      if (p) await this.store.updatePerson(p.id, Object.assign({}, common, { name: n }));
      else await this.store.addPerson(Object.assign({}, common, { name: n }));
      new Notice(t('personSaved'));
      if (this.opts.onSaved) this.opts.onSaved();
      this.close();
    };

    const actions = form.createDiv('pa-actions');
    const cancel = el('button', 'pa-btn', t('cancel'));
    cancel.onclick = () => this.close();
    const saveBtn = el('button', 'pa-btn primary', t('save'));
    saveBtn.onclick = submit;
    actions.append(cancel, saveBtn);

    form.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); void submit(); }
    });

    if (this.app.isMobile) {
      this.modalEl.addClass('pa-mobile-modal');
      const content = this.contentEl;
      const scrollIntoView = () => {
        const active = document.activeElement;
        if (!active || !content.contains(active)) return;
        const rect = active.getBoundingClientRect();
        const vv = window.visualViewport;
        const viewportBottom = vv ? vv.height : window.innerHeight;
        if (rect.bottom > viewportBottom - 80) {
          active.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      };
      const onFocusIn = (e) => {
        if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
          setTimeout(scrollIntoView, 300);
        }
      };
      content.addEventListener('focusin', onFocusIn);
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', scrollIntoView);
      }
      this._cleanupKeyboard = () => {
        content.removeEventListener('focusin', onFocusIn);
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', scrollIntoView);
        }
      };
    }

    name.focus();
  }
  onClose() {
    if (this._cleanupKeyboard) this._cleanupKeyboard();
    this.contentEl.empty();
  }
}

class TransactionFormModal extends Modal {
  constructor(app, store, existing, opts = {}) {
    super(app);
    this.store = store;
    this.existing = existing;
    this.opts = opts;
    this.type = existing ? existing.type : (opts.preset && opts.preset.type) || 'receivable';
    this._calCloses = [];
  }

  onOpen() {
    modalRtl(this);
    const preset = this.opts.preset || {};
    const editing = !!this.existing;
    const fa = CURRENT.locale === 'fa';
    const calendar = this.store.plugin.settings.calendar;
    Cal.ensure(this.store.plugin.app);
    this.titleEl.setText(editing ? t('editTxTitle') + ' · ' + this.existing.id : t('addTxTitle'));

    const form = this.contentEl.createDiv('pa-form');
    const err = form.createDiv('pa-form-error');
    const fail = (m) => { err.setText(m); err.addClass('show'); };

    const amount = inputText(t('phAmount'));
    amount.inputMode = 'decimal';
    amount.value = editing
      ? String(this.existing.amount)
      : (preset.amount != null ? String(preset.amount) : '');
    const amtFmt = attachAmountInput(amount, () => CURRENT.locale === 'fa');
    amtFmt.refresh();
    field(form, t('fAmount'), amount);

    let dueField = null;
    const updateDueVisibility = () => {
      if (!dueField) return;
      const origin = this.type === 'receivable' || this.type === 'debt';
      dueField.toggleClass('pa-hidden', !origin);
    };
    const typeWrap = form.createDiv('pa-field');
    typeWrap.createEl('label').setText(t('fType'));
    const seg = el('div', 'pa-seg');
    typeWrap.appendChild(seg);
    const typeOptions = preset.paymentOnly
      ? ['payment_received', 'payment_made']
      : ['receivable', 'debt', 'payment_received', 'payment_made'];
    const segBtns = new Map();
    for (const ty of typeOptions) {
      const b = el('button', 'pa-btn small' + (ty === this.type ? ' active' : ''), typeLabel(ty));
      b.onclick = () => {
        this.type = ty;
        segBtns.forEach((bb, tt) => bb.toggleClass('active', tt === ty));
        updateDueVisibility();
      };
      segBtns.set(ty, b);
      seg.appendChild(b);
    }

    const lockedPersonId = preset.lockPerson
      ? (this.existing ? this.existing.personId : preset.personId || '')
      : '';
    const personWrap = form.createDiv('pa-field');
    personWrap.createEl('label').setText(t('fPerson'));
    let personInput = null;
    if (lockedPersonId) {
      personWrap.appendChild(el('span', 'pa-locked', this.store.personName(lockedPersonId)));
    } else {
      personInput = inputText(t('phPerson'));
      personInput.setAttribute('list', 'pa-person-options');
      personInput.value = this.existing
        ? this.store.personName(this.existing.personId)
        : preset.personName || '';
      personWrap.appendChild(personInput);
      const dl = document.createElement('datalist');
      dl.id = 'pa-person-options';
      for (const p of this.store.data.people) dl.appendChild(new Option(p.name, p.name));
      personWrap.appendChild(dl);
    }

    const dateCtl = createDatePicker(calendar, fa);
    this._calCloses.push(dateCtl.close);
    field(form, t('fDate'), dateCtl.el);
    dateCtl.set(editing ? this.existing.date : todayISO());

    const dueCtl = createDatePicker(calendar, fa);
    this._calCloses.push(dueCtl.close);
    dueField = field(form, t('fDue'), dueCtl.el);
    dueCtl.set(editing && this.existing.dueDate ? this.existing.dueDate : '');
    updateDueVisibility();

    const cat = document.createElement('select');
    cat.appendChild(new Option(t('noCategory'), ''));
    for (const c of this.store.categories) cat.appendChild(new Option(c, c));
    cat.value = (this.existing && this.existing.category) || '';

    const desc = inputText(t('phDesc'));
    desc.value = (this.existing && this.existing.description) || '';
    const notes = document.createElement('textarea');
    notes.rows = 2;
    notes.value = (this.existing && this.existing.notes) || '';

    field(form, t('fCategory'), cat);
    field(form, t('fDesc'), desc);
    field(form, t('fNotes'), notes);

    const submit = async () => {
      const amountVal = parseAmount(amount.value);
      if (amountVal === null || amountVal <= 0) return fail(t('amountInvalid'));

      let personId = lockedPersonId;
      if (!personId) {
        const nameVal = personInput.value.trim();
        if (!nameVal) return fail(t('personRequired'));
        personId = (await this.store.ensurePerson(nameVal)).id;
      }

      const origin = this.type === 'receivable' || this.type === 'debt';
      const common = {
        type: this.type,
        amount: amountVal,
        date: dateCtl.get() || todayISO(),
        category: cat.value || undefined,
        description: desc.value.trim() || undefined,
        notes: notes.value.trim() || undefined,
        dueDate: origin && dueCtl.get() ? dueCtl.get() : undefined,
      };

      if (editing) await this.store.updateTransaction(this.existing.id, Object.assign({}, common, { personId }));
      else await this.store.addTransaction(Object.assign({}, common, { personId, linkedTo: preset.linkedTo }));

      new Notice(editing ? t('txUpdated') : t('txAdded'));
      if (this.opts.onSaved) this.opts.onSaved();
      this.close();
    };

    const actions = form.createDiv('pa-actions');
    const cancel = el('button', 'pa-btn', t('cancel'));
    cancel.onclick = () => this.close();
    const saveBtn = el('button', 'pa-btn primary', editing ? t('save') : t('addTxTitle'));
    saveBtn.onclick = submit;
    actions.append(cancel, saveBtn);

    form.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); void submit(); }
    });

    if (this.app.isMobile) {
      this.modalEl.addClass('pa-mobile-modal');
      const content = this.contentEl;
      const scrollIntoView = () => {
        const active = document.activeElement;
        if (!active || !content.contains(active)) return;
        const rect = active.getBoundingClientRect();
        const vv = window.visualViewport;
        const viewportBottom = vv ? vv.height : window.innerHeight;
        if (rect.bottom > viewportBottom - 80) {
          active.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      };
      const onFocusIn = (e) => {
        if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
          setTimeout(scrollIntoView, 300);
        }
      };
      content.addEventListener('focusin', onFocusIn);
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', scrollIntoView);
      }
      this._cleanupKeyboard = () => {
        content.removeEventListener('focusin', onFocusIn);
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', scrollIntoView);
        }
      };
    }

    amount.focus();
  }
  onClose() {
    if (this._cleanupKeyboard) this._cleanupKeyboard();
    closeActivePicker();
    for (const c of this._calCloses) {
      try { c(); } catch (e) { /* noop */ }
    }
    this._calCloses = [];
    this.contentEl.empty();
  }
}

class TransactionDetailModal extends Modal {
  constructor(app, store, tx, opts = {}) {
    super(app);
    this.store = store;
    this.tx = tx;
    this.opts = opts;
  }
  onOpen() {
    modalRtl(this);
    const fmt = this.store.fmt;
    const tx = this.tx;
    const st = this.store.ledger ? this.store.ledger.states.get(tx.id) : null;
    const origin = tx.type === 'receivable' || tx.type === 'debt';

    this.titleEl.setText(typeLabel(tx.type) + ' · ' + tx.id);
    const box = this.contentEl.createDiv('pa-detail');

    const rows = [
      [t('dPerson'), this.store.personName(tx.personId)],
      [t('dAmount'), fmt.amount(tx.amount)],
      [t('dDate'), fmt.date(tx.date)],
    ];
    if (origin && st) {
      rows.push([t('dStatus'),
        st.status === 'settled' ? t('settled')
          : st.status === 'partial' ? t('statusPartial', { amt: fmt.amount(st.remaining) })
          : t('statusOpen')]);
      if (tx.dueDate) {
        rows.push([t('dDue'), fmt.date(tx.dueDate) + (st.due && st.due.label ? ' (' + st.due.label + ')' : '')]);
      }
    }
    if (tx.category) rows.push([t('dCategory'), tx.category]);
    if (tx.description) rows.push([t('dDesc'), tx.description]);
    if (tx.notes) rows.push([t('dNotes'), tx.notes]);
    if (tx.linkedTo) rows.push([t('dLinked'), tx.linkedTo]);

    for (const [k, v] of rows) {
      const r = box.createDiv('pa-detail-row');
      r.createDiv('pa-detail-key').setText(k);
      r.createDiv('pa-detail-val').setText(v);
    }

    const actions = this.contentEl.createDiv('pa-actions');

    const edit = el('button', 'pa-btn', t('edit'));
    edit.onclick = () => {
      this.close();
      new TransactionFormModal(this.app, this.store, tx, { onSaved: this.opts.onChanged }).open();
    };
    actions.appendChild(edit);

    if (origin && st && st.remaining > EPS) {
      const settle = el('button', 'pa-btn primary', t('settleRemaining'));
      settle.onclick = () => {
        this.close();
        new ConfirmModal(this.app, {
          title: t('settleTxTitle'),
          lines: [
            tx.type === 'receivable'
              ? t('settleRecLine', { amt: fmt.amount(st.remaining), name: this.store.personName(tx.personId) })
              : t('settleDebtLine', { amt: fmt.amount(st.remaining), name: this.store.personName(tx.personId) }),
            t('settleNote'),
          ],
          confirmLabel: t('settle'),
          onConfirm: () => this.store.settleTransaction(tx.id),
        }).open();
      };
      actions.appendChild(settle);
    }

    const del = el('button', 'pa-btn danger', t('delete'));
    del.onclick = () => {
      this.close();
      const doDelete = async () => {
        await this.store.deleteTransaction(tx.id);
        new Notice(t('txDeleted'));
      };
      if (!this.store.confirmDelete) { void doDelete(); return; }
      new ConfirmModal(this.app, {
        title: t('deleteTxTitle'),
        lines: [
          this.store.personName(tx.personId),
          fmt.amount(tx.amount) + ' — ' + (tx.description || typeLabel(tx.type)),
          t('deleteTxNote'),
        ],
        confirmLabel: t('delete'),
        danger: true,
        onConfirm: doDelete,
      }).open();
    };
    actions.appendChild(del);
  }
  onClose() { this.contentEl.empty(); }
}

/* ========================= نمای اصلی ========================= */

const FILTERS = [
  ['all', 'filterAll'], ['receivables', 'filterRec'], ['debts', 'filterDebt'],
  ['settled', 'filterSettled'], ['unsettled', 'filterUnsettled'],
  ['overdue', 'filterOverdue'], ['due-soon', 'filterDueSoon'],
];
const SORTS = [
  ['newest', 'sortNewest'], ['oldest', 'sortOldest'], ['highest', 'sortHighest'],
  ['lowest', 'sortLowest'], ['due', 'sortDue'],
];

class AccountsView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.navigation = true;
    this.nav = { screen: 'dashboard', personId: null, search: '', filter: 'all', sort: 'newest' };
    this.unsub = null;
    this.modifyTimer = null;
  }
  getViewType() { return VIEW_TYPE_PERSONAL_ACCOUNTS; }
  getDisplayText() { return t('appTitle'); }
  getIcon() { return 'wallet'; }

  async onOpen() {
    this.contentEl.addClass('pa-view');
    this.unsub = this.plugin.accounts.subscribe(() => this.render());
    await this.plugin.accounts.reload();
    this.render();
  }
  async onClose() { if (this.unsub) this.unsub(); }
  navigate(patch) { Object.assign(this.nav, patch); this.render(); }

  render() {
    const root = this.contentEl;
    root.empty();
    root.toggleClass('pa-compact', this.plugin.settings.compact);
    root.toggleClass('pa-rtl', CURRENT.locale === 'fa');

    const store = this.plugin.accounts;
    const header = root.createDiv('pa-header');
    header.createDiv('pa-title').setText(t('appTitle'));

    const tabs = header.createDiv('pa-tabs');
    const mkTab = (label, screen) => {
      const active = this.nav.screen === screen || (screen === 'people' && this.nav.screen === 'person');
      const tab = el('div', 'pa-tab' + (active ? ' active' : ''), label);
      tab.onclick = () => this.navigate({ screen });
      tabs.appendChild(tab);
    };
    mkTab(t('tabDashboard'), 'dashboard');
    mkTab(t('tabPeople'), 'people');
    mkTab(t('tabTransactions'), 'transactions');

    const addBtn = el('button', 'pa-btn primary', t('addTx'));
    addBtn.onclick = () => new TransactionFormModal(this.app, store, null, {}).open();
    header.appendChild(addBtn);

    const dataFileBtn = iconButton('file-text', t('openNote'), async () => {
      try {
        const path = normalizePath((this.plugin.settings.filePath || '').trim() || DEFAULT_FILE_PATH);
        let file = this.app.vault.getAbstractFileByPath(path);
        if (!(file instanceof TFile)) {
          await this.plugin.repo.writeReadableNote(store.data);
          file = this.app.vault.getAbstractFileByPath(path);
        }
        if (file instanceof TFile) await this.app.workspace.getLeaf('tab').openFile(file);
      } catch (e) {
        new Notice(String(e instanceof Error ? e.message : e));
      }
    });
    header.appendChild(dataFileBtn);

    header.appendChild(
      iconButton('refresh-cw', t('reload'), () => {
        void store.reload();
      })
    );

    const body = root.createDiv('pa-body');
    if (store.error) { this.renderError(body); return; }

    switch (this.nav.screen) {
      case 'dashboard': this.renderDashboard(body); break;
      case 'people': this.renderPeople(body); break;
      case 'person': this.renderPerson(body); break;
      case 'transactions': this.renderTransactions(body); break;
    }
  }

  renderError(body) {
    const store = this.plugin.accounts;
    const card = body.createDiv('pa-card pa-error');
    card.createDiv('pa-card-title').setText(t('dataProblem'));
    card.createDiv('pa-muted').setText(store.error || t('unknownError'));
    const actions = card.createDiv('pa-actions');
    const retry = el('button', 'pa-btn', t('retry'));
    retry.onclick = () => { void store.reload(); };
    actions.appendChild(retry);
  }

  dueChipFor(tx) {
    const st = this.plugin.accounts.ledger ? this.plugin.accounts.ledger.states.get(tx.id) : null;
    if (!st || !st.due) return null;
    return dueChip(st.due, this.plugin.accounts.fmt.date(tx.dueDate));
  }

  txRow(tx, showPerson) {
    const store = this.plugin.accounts;
    const fmt = store.fmt;
    const st = store.ledger ? store.ledger.states.get(tx.id) : null;
    const row = el('div', 'pa-row');
    const main = row.createDiv('pa-row-main');
    const title = tx.description || typeLabel(tx.type);
    main.createDiv('pa-row-title')
      .setText(showPerson ? store.personName(tx.personId) + ' — ' + title : title);

    const sub = main.createDiv('pa-row-sub');
    sub.appendChild(el('span', 'pa-chip', typeLabel(tx.type)));
    if (tx.category) sub.appendChild(el('span', 'pa-chip', tx.category));
    const chip = this.dueChipFor(tx);
    if (chip) sub.appendChild(chip);
    if (st && st.status === 'partial') {
      sub.appendChild(el('span', 'pa-money dim', t('remainingLabel') + ' ' + fmt.amount(st.remaining)));
    }
    if (st && st.status === 'settled') {
      sub.appendChild(el('span', 'pa-chip settled', t('settled')));
    }

    const positive = tx.type === 'receivable' || tx.type === 'payment_made';
    const amt = row.createDiv('pa-row-amt pa-money ' + (positive ? 'pos' : 'neg'));
    amt.setText((positive ? '+' : '−') + fmt.amount(tx.amount, false));

    row.onclick = () => new TransactionDetailModal(this.app, store, tx, {}).open();
    return row;
  }

  personRow(b) {
    const fmt = this.plugin.accounts.fmt;
    const row = el('div', 'pa-row');
    const main = row.createDiv('pa-row-main');
    main.createDiv('pa-row-title').setText(b.person.name);
    if (b.person.phone || b.person.tags.length) {
      const sub = main.createDiv('pa-row-sub');
      if (b.person.phone) sub.createSpan().setText(b.person.phone);
      for (const tg of b.person.tags.slice(0, 3)) sub.appendChild(el('span', 'pa-chip', tg));
    }
    const wrap = row.createDiv('pa-row-amt');
    if (Math.abs(b.net) <= EPS) {
      if (b.txCount > 0) wrap.appendChild(el('span', 'pa-chip settled', t('settled')));
      else wrap.appendChild(el('span', 'pa-money dim', t('noBalance')));
    } else {
      const pos = b.net > 0;
      wrap.appendChild(el('div', 'pa-money ' + (pos ? 'pos' : 'neg'), fmt.amount(Math.abs(b.net))));
      wrap.createDiv('pa-row-sub').setText(pos ? t('receivable') : t('debt'));
    }
    row.onclick = () => this.openPerson(b.person.id);
    return row;
  }

  attentionRow(item) {
    const fmt = this.plugin.accounts.fmt;
    const row = el('div', 'pa-row');
    const main = row.createDiv('pa-row-main');
    main.createDiv('pa-row-title').setText(item.personName + ' — ' + fmt.amount(item.remaining));
    const sub = main.createDiv('pa-row-sub');
    sub.createSpan().setText(item.tx.description || typeLabel(item.tx.type));
    sub.appendChild(dueChip(item.due, fmt.date(item.tx.dueDate)));
    row.onclick = () => this.openPerson(item.tx.personId);
    return row;
  }

  stat(parent, label, value, accent) {
    const d = parent.createDiv('pa-stat' + (accent ? ' ' + accent : ''));
    d.createDiv('pa-stat-label').setText(label);
    d.createDiv('pa-stat-value').setText(value);
  }

  openPerson(personId) { this.navigate({ screen: 'person', personId }); }

  renderDashboard(body) {
    const store = this.plugin.accounts;
    const fmt = store.fmt;
    const L = store.ledger;
    const s = L.stats;

    const tIso = todayISO();
    const tWd = isoWeekday(tIso);
    const tDate = calDateFromISO(tIso, this.plugin.settings.calendar);
    const evs = tDate ? Cal.eventsOf(tDate) : [];
    body.createDiv('pa-todayline').setText(
      fmt.date(tIso) +
      (tWd === null ? '' : ' · ' + Cal.weekdayName(tWd)) +
      (evs.length ? '  •  ' + evs.slice(0, 2).join(' • ') : ''));

    const grid = body.createDiv('pa-stats');
    this.stat(grid, t('statTotalRec'), fmt.amount(s.totalReceivables), 'accent-rec');
    this.stat(grid, t('statTotalDebt'), fmt.amount(s.totalDebts), 'accent-debt');
    this.stat(grid, t('statNet'), fmt.amount(s.net), 'accent-net');
    this.stat(grid, t('statPeople'), localizeDigits(String(s.peopleCount), CURRENT.locale === 'fa'));
    this.stat(grid, t('statUnsettled'), localizeDigits(String(s.unpaidCount), CURRENT.locale === 'fa'));
    this.stat(grid, t('statSettled'), localizeDigits(String(s.settledCount), CURRENT.locale === 'fa'));
    this.stat(grid, t('statOverdue'), localizeDigits(String(s.overdueCount), CURRENT.locale === 'fa'));
    this.stat(grid, t('statDueSoon'), localizeDigits(String(s.dueSoonCount), CURRENT.locale === 'fa'));

    if (s.peopleCount === 0) {
      const c = body.createDiv('pa-card');
      c.createDiv('pa-empty').setText(t('getStarted'));
      return;
    }

    const upc = body.createDiv('pa-card');
    upc.createDiv('pa-card-title').setText(t('upcoming'));
    if (!L.attention.length) {
      upc.createDiv('pa-empty').setText(t('nothingDue'));
    } else {
      const list = upc.createDiv('pa-scroll');
      for (const item of L.attention.slice(0, 10)) list.appendChild(this.attentionRow(item));
    }

    const pc = body.createDiv('pa-card');
    const title = pc.createDiv('pa-card-title');
    title.setText(t('peopleCard'));
    const all = el('a', 'pa-link', t('viewAll'));
    all.onclick = () => this.navigate({ screen: 'people' });
    title.appendChild(all);

    const balances = [...L.balances.values()]
      .sort((a, b) => Math.abs(b.net) - Math.abs(a.net) || a.person.name.localeCompare(b.person.name));
    const rows = pc.createDiv('pa-scroll');
    for (const b of balances.slice(0, 10)) rows.appendChild(this.personRow(b));
  }

  renderPeople(body) {
    const store = this.plugin.accounts;
    const L = store.ledger;

    const bar = body.createDiv('pa-toolbar');
    const search = el('input');
    search.type = 'search';
    search.placeholder = t('searchPeople');
    search.value = this.nav.search;
    bar.appendChild(search);

    const add = el('button', 'pa-btn primary', t('addPersonBtn'));
    add.onclick = () => new PersonModal(this.app, store, null, {}).open();
    bar.appendChild(add);

    const listWrap = body.createDiv('pa-card');
    const renderList = () => {
      listWrap.empty();
      const q = this.nav.search.trim().toLowerCase();
      let bs = [...L.balances.values()]
        .sort((a, b) => Math.abs(b.net) - Math.abs(a.net) || a.person.name.localeCompare(b.person.name));
      if (q) {
        bs = bs.filter((b) =>
          b.person.name.toLowerCase().includes(q) ||
          (b.person.phone || '').includes(q) ||
          b.person.tags.some((tg) => tg.toLowerCase().includes(q)));
      }
      if (!bs.length) listWrap.createDiv('pa-empty').setText(t('noPeople'));
      for (const b of bs) {
        const row = this.personRow(b);
        row.appendChild(iconButton('pencil', t('edit'), (e) => {
          e.stopPropagation();
          new PersonModal(this.app, store, b.person, {}).open();
        }));
        row.appendChild(iconButton('trash-2', t('delete'), (e) => {
          e.stopPropagation();
          this.confirmDeletePerson(b.person.id, b.person.name);
        }));
        listWrap.appendChild(row);
      }
    };
    search.oninput = () => { this.nav.search = search.value; renderList(); };
    renderList();
  }

  confirmDeletePerson(id, name) {
    const store = this.plugin.accounts;
    const doDelete = async () => {
      await store.deletePerson(id);
      if (this.nav.personId === id) this.navigate({ screen: 'people' });
    };
    if (!store.confirmDelete) { void doDelete(); return; }
    new ConfirmModal(this.app, {
      title: t('deletePersonTitle'),
      lines: [t('deletePersonLine', { name }), t('deleteTxNote')],
      confirmLabel: t('delete'),
      danger: true,
      onConfirm: doDelete,
    }).open();
  }

  renderPerson(body) {
    const store = this.plugin.accounts;
    const fmt = store.fmt;
    const L = store.ledger;
    const person = store.data.people.find((p) => p.id === this.nav.personId);
    if (!person) { body.createDiv('pa-empty').setText(t('noPeople')); return; }
    const b = L.balances.get(person.id);

    const back = el('button', 'pa-btn small', t('back'));
    back.onclick = () => this.navigate({ screen: 'people' });
    body.appendChild(back);

    const card = body.createDiv('pa-card');
    const head = card.createDiv('pa-person-head');
    const nameEl = head.createDiv('pa-row-title');
    nameEl.setText(person.name);
    nameEl.style.fontSize = '1.15em';
    head.appendChild(iconButton('pencil', t('edit'), () =>
      new PersonModal(this.app, store, person, {}).open()));

    const sub = card.createDiv('pa-row-sub');
    if (person.phone) sub.createSpan().setText(person.phone);
    if (person.email) sub.createSpan().setText(person.email);
    for (const tg of person.tags) sub.appendChild(el('span', 'pa-chip', tg));
    if (person.notes) card.createDiv('pa-muted').setText(person.notes);

    const tiles = card.createDiv('pa-tiles');
    this.stat(tiles, t('recRemaining'), fmt.amount(b.remainingReceivable), 'accent-rec');
    this.stat(tiles, t('debtRemaining'), fmt.amount(b.remainingDebt), 'accent-debt');
    const netWord = b.net > EPS ? ' ' + t('receivable') : b.net < -EPS ? ' ' + t('debt') : '';
    this.stat(tiles, t('net'), fmt.amount(b.net) + netWord, 'accent-net');

    const actions = body.createDiv('pa-actions');
    const btn = (label, fn, cls) => {
      const x = el('button', 'pa-btn ' + (cls || ''), label);
      x.onclick = fn;
      actions.appendChild(x);
    };
    btn(t('addRec'), () => new TransactionFormModal(this.app, store, null, {
      preset: { personId: person.id, type: 'receivable', lockPerson: true },
    }).open());
    btn(t('addDebt'), () => new TransactionFormModal(this.app, store, null, {
      preset: { personId: person.id, type: 'debt', lockPerson: true },
    }).open());
    btn(t('recordPayment'), () => {
      const bb = store.ledger.balances.get(person.id);
      const type = bb.remainingReceivable > EPS ? 'payment_received' : 'payment_made';
      const amount = bb.remainingReceivable > EPS ? bb.remainingReceivable
        : bb.remainingDebt > EPS ? bb.remainingDebt : undefined;
      new TransactionFormModal(this.app, store, null, {
        preset: { personId: person.id, type, amount, lockPerson: true, paymentOnly: true },
      }).open();
    });
    if (b.remainingReceivable > EPS || b.remainingDebt > EPS) {
      btn(t('settleAccount'), () => {
        const bb = store.ledger.balances.get(person.id);
        const lines = [];
        if (bb.remainingReceivable > EPS) {
          lines.push(t('settleRecLine', { amt: fmt.amount(bb.remainingReceivable), name: person.name }));
        }
        if (bb.remainingDebt > EPS) {
          lines.push(t('settleDebtLine', { amt: fmt.amount(bb.remainingDebt), name: person.name }));
        }
        new ConfirmModal(this.app, {
          title: t('settleAccount'),
          lines: [...lines, t('settleNote')],
          confirmLabel: t('settle'),
          onConfirm: () => store.settlePerson(person.id),
        }).open();
      }, 'primary');
    }
    btn(t('deletePersonBtn'), () => this.confirmDeletePerson(person.id, person.name), 'danger');

    const hist = body.createDiv('pa-card');
    hist.createDiv('pa-card-title').setText(t('history'));
    const txs = store.data.transactions
      .filter((tx) => tx.personId === person.id)
      .sort((a, z) => z.date.localeCompare(a.date) || z.createdAt - a.createdAt);
    if (!txs.length) {
      hist.createDiv('pa-empty').setText(t('noTx'));
    } else {
      let lastDate = '';
      for (const tx of txs) {
        if (tx.date !== lastDate) {
          lastDate = tx.date;
          hist.createDiv('pa-date-group').setText(fmt.date(tx.date));
        }
        hist.appendChild(this.txRow(tx, false));
      }
      const footer = hist.createDiv('pa-remaining');
      if (b.net > EPS) footer.setText(t('remainingLabel') + ' ' + fmt.amount(b.net) + ' ' + t('receivable'));
      else if (b.net < -EPS) footer.setText(t('remainingLabel') + ' ' + fmt.amount(-b.net) + ' ' + t('debt'));
      else footer.setText(t('settled'));
    }
  }

  renderTransactions(body) {
    const store = this.plugin.accounts;
    const fmt = store.fmt;
    const L = store.ledger;

    const bar = body.createDiv('pa-toolbar');
    const search = el('input');
    search.type = 'search';
    search.placeholder = t('searchTx');
    search.value = this.nav.search;

    const filterSel = el('select');
    for (const [v, key] of FILTERS) filterSel.appendChild(new Option(t(key), v));
    filterSel.value = this.nav.filter;

    const sortSel = el('select');
    for (const [v, key] of SORTS) sortSel.appendChild(new Option(t(key), v));
    sortSel.value = this.nav.sort;

    bar.append(search, filterSel, sortSel);

    const list = body.createDiv('pa-card');
    const renderList = () => {
      list.empty();
      const q = normalizeDigits(this.nav.search.trim().toLowerCase());
      const txs = store.data.transactions.filter((tx) => {
        const st = L.states.get(tx.id);
        switch (this.nav.filter) {
          case 'receivables': return tx.type === 'receivable' || tx.type === 'payment_received';
          case 'debts': return tx.type === 'debt' || tx.type === 'payment_made';
          case 'settled': return !!st && st.status === 'settled';
          case 'unsettled': return !!st && st.status !== 'settled';
          case 'overdue': return !!st && !!st.due && st.due.kind === 'overdue';
          case 'due-soon': return !!st && !!st.due && (st.due.kind === 'today' || st.due.kind === 'soon');
          default: return true;
        }
      }).filter((tx) => {
        if (!q) return true;
        const hay = normalizeDigits([
          store.personName(tx.personId), tx.description || '', tx.category || '',
          tx.notes || '', tx.id, String(tx.amount),
        ].join(' ').toLowerCase());
        return hay.includes(q);
      });

      const byDue = (a, b) => {
        const sa = L.states.get(a.id), sb = L.states.get(b.id);
        const da = sa && sa.due ? sa.due.days : 999999;
        const db = sb && sb.due ? sb.due.days : 999999;
        return da - db || b.date.localeCompare(a.date);
      };
      const comparators = {
        newest: (a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt,
        oldest: (a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt,
        highest: (a, b) => b.amount - a.amount,
        lowest: (a, b) => a.amount - b.amount,
        due: byDue,
      };
      txs.sort(comparators[this.nav.sort]);

      if (!txs.length) list.createDiv('pa-empty').setText(t('noTxMatch'));
      let lastDate = '';
      for (const tx of txs) {
        if (this.nav.sort === 'newest' || this.nav.sort === 'oldest') {
          if (tx.date !== lastDate) {
            lastDate = tx.date;
            list.createDiv('pa-date-group').setText(fmt.date(tx.date));
          }
        }
        list.appendChild(this.txRow(tx, true));
      }
    };

    search.oninput = () => { this.nav.search = search.value; renderList(); };
    filterSel.onchange = () => { this.nav.filter = filterSel.value; renderList(); };
    sortSel.onchange = () => { this.nav.sort = sortSel.value; renderList(); };
    renderList();
  }
}

/* ========================= ورودی پلاگین ========================= */

class PersonalAccountsPlugin extends Plugin {
  async onload() {
    await this.loadSettings();

    this.fmt = new Fmt(() => this.settings);
    this.repo = new PluginDataStore(this.app, () => this.settings, this.fmt, this);
    this.accounts = new AccountsStore(this);

    Cal.appRef = this.app;
    Cal.refresh(this.app);
    this.app.workspace.onLayoutReady(() => { Cal.refresh(this.app); });

    this.registerView(VIEW_TYPE_PERSONAL_ACCOUNTS, (leaf) => new AccountsView(leaf, this));

    this.addRibbonIcon('wallet', t('ribDashboard'), () => { void this.openView('dashboard'); });
    this.addRibbonIcon('banknote-arrow-up', t('ribQuickAdd'), () => { void this.quickAddTransaction(); });
    this.addSettingTab(new PASettingTab(this.app, this));

    this.addCommand({ id: 'open-dashboard', name: t('cmdOpen'), callback: () => { void this.openView('dashboard'); } });
    this.addCommand({ id: 'add-transaction', name: t('cmdAddTx'), callback: () => { void this.quickAddTransaction(); } });
    this.addCommand({
      id: 'add-person', name: t('cmdAddPerson'),
      callback: () => new PersonModal(this.app, this.accounts, null, {}).open(),
    });
    this.addCommand({ id: 'search-transactions', name: t('cmdSearch'), callback: () => { void this.openView('transactions'); } });
  }
  onunload() {}

  async loadSettings() {
    const raw = (await this.loadData()) || {};
    // اگر data.json قبلاً داده‌های پلاگین را داشته، تنظیمات را از کلید settings بخوان
    const saved = raw.settings ? raw.settings : raw;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, saved);
    if (!raw.settingsVersion || raw.settingsVersion < 2) {
  this.settings.locale = 'en';
  this.settings.calendar = 'gregorian';
  this.settings.currency = 'usd';
  if (JSON.stringify(this.settings.categories) === JSON.stringify(OLD_DEFAULT_CATEGORIES)) {
    this.settings.categories = [...DEFAULT_CATEGORIES];
  }
  this.settings.settingsVersion = 2;
}
    if (!Array.isArray(this.settings.categories) || this.settings.categories.length === 0) {
      this.settings.categories = [...DEFAULT_CATEGORIES];
    }
    CURRENT.locale = this.settings.locale;
  }

  async saveSettings() {
    CURRENT.locale = this.settings.locale;
    const current = (await this.loadData()) || {};
    current.settings = this.settings;
    current.settingsVersion = this.settings.settingsVersion;
    await this.saveData(current);
    if (this.accounts) await this.accounts.reload();
  }

  async openView(screen) {
    try {
      const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_PERSONAL_ACCOUNTS);
      const leaf = existing.length
        ? existing[0]
        : this.app.workspace.getLeaf(this.app.isMobile ? false : true);
      await leaf.setViewState({ type: VIEW_TYPE_PERSONAL_ACCOUNTS, active: true });
      this.app.workspace.revealLeaf(leaf);
      if (leaf.view instanceof AccountsView) leaf.view.navigate({ screen: screen || 'dashboard' });
    } catch (e) {
      new Notice('⚠ ' + (e instanceof Error ? e.message : String(e)));
    }
  }

  async quickAddTransaction() {
    try {
      await this.accounts.ready();
      new TransactionFormModal(this.app, this.accounts, null, {
        onSaved: () => { if (this.settings.openAfterAdd) void this.openView('dashboard'); },
      }).open();
    } catch (e) {
      new Notice('⚠ ' + (e instanceof Error ? e.message : String(e)));
    }
  }
}

module.exports = PersonalAccountsPlugin;
module.exports.default = PersonalAccountsPlugin;