# CONTEXT — iRemainder

This file is the **ubiquitous-language glossary** for iRemainder. It defines
the domain terms used across code, conversations, and docs. It is *not* a spec
and contains no implementation details — only the agreed meaning of words.

The app is Persian-language (Farsi UI, RTL, Jalali calendar, Rial currency).
Terms below are given in English with their Persian UI label where relevant.

---

## People

### Customer (مشتری)
A person who buys goods from the store and pays in **Installments**. Has a
full name and a phone number. A Customer owns one or more **Plans**.

### Operator (اپراتور)
The store staff member who uses this app to track and chase payments. There
is exactly one shared operator login (a single password). The operator is
*not* a Customer and has no row in the database.

> **"User" is deliberately absent from this vocabulary.** There is no
> end-user account model. If multi-operator accounts are added later, the
> term `Operator` stays and gains a row — do not introduce "user".

---

## Agreements & payments

### Plan (برنامه اقساط)
A single installment agreement between one **Customer** and the store:
a total amount split into N **Installments** spaced a fixed number of days
apart (intervalDays, default 30 = monthly), starting on a start date. The
Plan is created once; its Installments are derived from it by
auto-generation.

### Installment (قسط)
One scheduled payment within a **Plan**. Has a 1-based number (1..N), a due
date, an amount, and a paid/unpaid state. This is the atom the calendar and
the call list are built from.

### Due Date (سررسید)
The date an **Installment** must be paid by. Stored as an ISO timestamp
(noon UTC to avoid timezone day-flips). On the calendar it is displayed in
the **Jalali** calendar.

### Overdue (تأخیر)
An **Installment** whose **Due Date** has passed and is still unpaid. Shows
a "X روز تأخیر" (X days late) badge. Overdue installments bubble up to the
today's-action list so the operator can keep chasing them.

### Paid (پرداخت‌شده)
The state of an **Installment** the operator has marked settled. Has a
`paidAt` timestamp. **A calendar day shows a dot iff it has at least one
unpaid Installment due that day** — fully-paid days render clean.

---

## Communication

### SMS Template (الگوی پیامک)
A single app-wide message template (editable in Settings) into which
placeholders are substituted before sending. Placeholders:
`{name}`, `{amount}`, `{dueDate}`, `{installmentNo}`, `{totalInstallments}`.

### Send SMS (ارسال پیامک)
Opening the device's native SMS app (via an `sms:` URI) pre-filled with the
rendered template. iRemainder does *not* send SMS itself — that would
require a paid gateway (Kavenegar / Farapayamak). The gateway can be added
later behind the same `lib/sms.ts` seam.

---

## Time

### Jalali calendar (تقویم شمسی)
The Persian solar calendar (Farvardin..Esfand, Saturday-first week). All
dates shown to the operator are Jalali. Internally dates are stored as ISO
and converted for display.

### Interval (بازه)
The spacing between consecutive **Installments** in a **Plan**, in days.
Default 30 (monthly). This build supports monthly only.

---

## Surfaces

### Year Overview (نمای سال)
The home screen: all 12 months of the selected Jalali year as compact
grids, with dots on days that have unpaid Installments due.

### Day Sheet (برگه روز)
The bottom sheet that opens when the operator taps a day: lists every
Installment due that day with the Customer's name, phone, and amount, plus
Call / SMS / Paid actions.

### Today's Action List (اقساط امروز)
The list pinned to the top of the home screen: every unpaid Installment
due today or earlier (overdue first), with quick Call / SMS / Paid actions.
