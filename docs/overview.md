# Pulse Dashboard — Tổng quan dự án

## Mục lục

1. [Giới thiệu](#giới-thiệu)
2. [Công nghệ sử dụng](#công-nghệ-sử-dụng)
3. [Cấu trúc thư mục](#cấu-trúc-thư-mục)
4. [Routing (App Router)](#routing-app-router)
5. [Các Component chính](#các-component-chính)
6. [Giao diện & Theme](#giao-diện--theme)
7. [Kết nối Google Sheets API](#kết-nối-google-sheets-api)
8. [Luồng dữ liệu](#luồng-dữ-liệu)
9. [Cách chạy dự án](#cách-chạy-dự-án)
10. [Hướng dẫn mở rộng](#hướng-dẫn-mở-rộng)

---

## Giới thiệu

**Pulse Dashboard** là một ứng dụng web quản lý KPI (Key Performance Indicators) và công việc theo tuần, được xây dựng bằng **Next.js 16 (App Router)** với **TypeScript** và **Tailwind CSS v4**. Ứng dụng hiển thị:

- 4 thẻ KPI tổng quan (Tasks Completed, On-time Delivery, Billable Hours, Avg. Quality Score)
- Biểu đồ cột hoạt động theo tuần (Completed vs Planned)
- Danh sách dự án đang chạy
- Sidebar menu điều hướng với cấu trúc Workspace + cây Projects theo năm/khách hàng

Dữ liệu được lấy từ **Google Sheets API** thông qua service account, nhưng hiện tại đang ở chế độ chờ kết nối (hiển thị UI trống).

---

## Công nghệ sử dụng

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| **Next.js** | 16.2.9 | Framework React với App Router (server & client components) |
| **React** | 19.2.4 | Thư viện UI |
| **TypeScript** | ^5 | Kiểm soát kiểu dữ liệu tĩnh |
| **Tailwind CSS** | ^4 (standalone) | Utility-first CSS, không cần PostCSS truyền thống |
| **Lucide React** | ^1.21 | Icon set |
| **Recharts** | ^3.8.1 | Biểu đồ cột (BarChart) |
| **Google APIs (googleapis)** | ^173 | Kết nối Google Sheets |

---

## Cấu trúc thư mục

```
dashboard_kpi/
├── app/                              # Next.js App Router
│   ├── globals.css                   # Tailwind v4 import + custom scrollbar
│   ├── layout.tsx                    # Root layout (html, body, font settings)
│   ├── (auth)/                       # Route group cho auth
│   │   └── login/page.tsx
│   ├── (dashboard)/                  # Route group cho Dashboard (chính)
│   │   ├── layout.tsx                # Dashboard layout: Sidebar + Header + Main
│   │   ├── page.tsx                  # Trang chủ Dashboard (KPI cards + Chart + Projects)
│   │   ├── projects/page.tsx
│   │   ├── kpis/page.tsx
│   │   ├── weekly-reports/page.tsx
│   │   └── years/page.tsx
│   └── api/
│       └── tasks/route.ts            # API route (nếu cần)
├── components/
│   ├── Sidebar.tsx                   # Sidebar chính (cây Projects theo năm/khách hàng)
│   ├── KpiCard.tsx                   # Card KPI (title, value, progress bar, footer)
│   ├── WeeklyChart.tsx               # Biểu đồ cột Recharts
│   └── ui/                           # Thư mục UI components (có thể mở rộng)
├── lib/
│   ├── db.ts                         # Google Sheets API client (auth + query)
│   └── credentials/
│       └── service-account.json      # Service account key (Google Cloud)
├── docs/
│   └── overview.md                   # File này
├── public/                           # Static assets (SVGs...)
├── tailwind.config.ts                # Tailwind v3-style config (không bắt buộc với v4)
├── tsconfig.json
└── package.json
```

### Giải thích Route Groups

- **`(auth)`** — Route group có dấu ngoặc đơn, không ảnh hưởng đến URL. Các page bên trong được tổ chức nhóm nhưng URL vẫn giữ nguyên (vd: `/login`).
- **`(dashboard)`** — Tương tự, chứa layout và pages của Dashboard. Layout này chỉ áp dụng cho các page bên trong nhóm.

---

## Routing (App Router)

| URL | File | Component |
|-----|------|-----------|
| `/` | `app/(dashboard)/page.tsx` | DashboardMainPage (KPI overview) |
| `/projects` | `app/(dashboard)/projects/page.tsx` | ProjectsPage (placeholder) |
| `/kpis` | `app/(dashboard)/kpis/page.tsx` | KPIsPage (placeholder) |
| `/weekly-reports` | `app/(dashboard)/weekly-reports/page.tsx` | WeeklyReportsPage (placeholder) |
| `/years` | `app/(dashboard)/years/page.tsx` | YearsReportsPage (placeholder) |
| `/login` | `app/(auth)/login/page.tsx` | (chưa có nội dung) |

**Lưu ý:** `app/page.tsx` đã bị xóa để tránh conflict route `/` với `app/(dashboard)/page.tsx`.

---

## Các Component chính

### 1. `app/(dashboard)/layout.tsx` (Dashboard Layout)

- **Client component** (`"use client"`) — sử dụng `usePathname()` để active/highlight menu.
- Gồm 3 phần:
  - **Sidebar** (trái): Logo Pulse + menu Workspace (Dashboard, Projects, KPIs, Weekly Reports) + user info (Alex Tran).
  - **Header** (trên): Toggle Personal/Team + dropdown user.
  - **Main** (phải): Render `children` với `max-w-5xl`.

### 2. `components/Sidebar.tsx`

- **Client component** — quản lý trạng thái mở/đóng các nhánh trong cây Projects.
- Cấu trúc phân cấp:
  - **Main**: Dashboard, Task Review, Task Library, Reports.
  - **Projects**: Theo năm → Theo khách hàng → Danh sách project.
- Dùng `ChevronDown` / `ChevronRight` để toggle.

### 3. `components/KpiCard.tsx`

- **Props**: `title`, `value`, `percentage`, `progress` (0-100), `footer`.
- Hiển thị: title → value + percentage badge → progress bar (màu xanh) → footer text.
- Style: nền `#121318`, border `zinc-800/60`, bo góc `rounded-xl`.

### 4. `components/WeeklyChart.tsx`

- **Client component** — dùng Recharts `BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer`.
- **Props**: `chartData: ChartDataItem[]` (mỗi item: `name`, `Completed`, `Planned`).
- Khi `chartData` rỗng → hiển thị placeholder "No chart data available".
- 2 bar màu: `#2563eb` (Completed) / `#06b6d4` (Planned).

---

## Giao diện & Theme

### Màu sắc chủ đạo

| Vai trò | Mã màu |
|---------|--------|
| Nền Dashboard | `#0d0e12` |
| Nền Card | `#121318` |
| Border | `zinc-800/60` hoặc `zinc-800/80` |
| Text chính | `zinc-100` |
| Text phụ | `zinc-500`, `zinc-600` |
| Accent (Progress bar, icon active) | `blue-500` (`#2563eb` / `#3b82f6`) |
| Chart Completed | `#2563eb` |
| Chart Planned | `#06b6d4` |
| Percentage badge (tăng trưởng) | `green-400` với nền `green-500/10` |

### Font & Typography

- Font mặc định hệ thống (không load Google Fonts).
- `font-feature-settings: "cv02", "cv03", "cv04", "cv11"` cho số đẹp hơn.
- Cỡ chữ nhỏ gọn: title 20-24px, card value ~20px, label ~11-12px, footer ~9-10px.

### Scrollbar

- Custom scrollbar siêu mỏng (6px), tối màu, bo tròn.

### Tailwind CSS v4

- File `app/globals.css` dùng `@import "tailwindcss"` (cú pháp v4).
- `@theme` block định nghĩa `--color-dashboard-bg: #0d0e12`.
- `@utility html-body-reset` dùng để reset html/body.

---

## Kết nối Google Sheets API

### File: `lib/db.ts`

```typescript
import { google } from "googleapis";
import path from "path";

const SHEET_ID = "1ej1tIq4nsR2xmFPL3Wpm47YjorVNsf4qmrW7uLxyvjo";
const CREDENTIALS_PATH = path.join(process.cwd(), "lib", "credentials", "service-account.json");
```

- Dùng **Google Auth Library** với service account file JSON.
- Scope: `https://www.googleapis.com/auth/spreadsheets.readonly` (chỉ đọc).
- Hàm chính:
  - `getSheetsClient()` — khởi tạo authenticated Sheets client.
  - `listSheetTitles()` — lấy danh sách tên sheet từ spreadsheet.

### Cách tích hợp dữ liệu

Hiện tại `app/(dashboard)/page.tsx` đã import `getDashboardData` từ `lib/db` nhưng chưa gọi. Cấu trúc dữ liệu mong đợi:

```typescript
interface ProjectItem {
  name: string;
  client: string;
  status: string;
  color: string;    // Tailwind classes cho status badge
  progress: number;
  date: string;
}
```

---

## Luồng dữ liệu

```
Google Sheets API
    ↓ (qua lib/db.ts)
Dashboard Page (Server Component hoặc client fetch)
    ↓
KpiCard × 4  |  WeeklyChart  |  Active Projects list
```

**Trạng thái hiện tại:** Tất cả data mẫu đã xóa, UI hiển thị trạng thái "No data / Awaiting data from Sheet" cho đến khi kết nối Sheets được hoàn thiện.

---

## Cách chạy dự án

```bash
# 1. Cài dependencies
npm install

# 2. Chạy dev server
npm run dev

# 3. Mở trình duyệt
open http://localhost:3000
```

### Scripts có sẵn

| Script | Lệnh | Mô tả |
|--------|------|-------|
| `dev` | `next dev` | Chạy development server |
| `build` | `next build` | Build production |
| `start` | `next start` | Chạy production server |
| `lint` | `eslint` | Kiểm tra code |

---

## Hướng dẫn mở rộng

### Thêm page mới

1. Tạo file `app/(dashboard)/<tên-page>/page.tsx`
2. Thêm menu item vào `menuItems` trong `app/(dashboard)/layout.tsx`:

```tsx
{ icon: <YourIcon size={16} />, label: "Tên Page", href: "/<tên-page>" }
```

### Kết nối Google Sheets thật

Trong `app/(dashboard)/page.tsx`, gọi hàm từ `lib/db.ts`:

```tsx
import { getSheetsClient } from "@/lib/db";

const sheets = await getSheetsClient();
const res = await sheets.spreadsheets.values.get({
  spreadsheetId: "YOUR_SHEET_ID",
  range: "Sheet1!A:E",
});
const rows = res.data.values;
```

Sau đó map dữ liệu vào `projects` và `weeklyActivity` để render.

### Thêm biểu đồ mới

Dùng Recharts (đã cài sẵn): LineChart, PieChart, AreaChart. Xem [recharts.org](https://recharts.org) để tham khảo API.

### Sửa theme

- Màu sắc: Sửa trực tiếp trong Tailwind classes ở từng component.
- Biến global: Thêm vào `@theme` block trong `app/globals.css`.

---

## Ghi chú quan trọng

1. **Không có `app/page.tsx`** — đã xóa để tránh conflict route `/`. Layout dashboard được xác định bởi `app/(dashboard)/layout.tsx`.
2. **`Sidebar.tsx` và `app/(dashboard)/layout.tsx` là 2 sidebar khác nhau**: Sidebar cũ (components/Sidebar.tsx) hiện không được dùng trong layout — layout tự render sidebar riêng. Có thể thay thế sau nếu muốn.
3. **Google Sheets credentials**: File `lib/credentials/service-account.json` đã tồn tại, cần đảm bảo service account có quyền truy cập vào sheet với ID `1ej1tIq4nsR2xmFPL3Wpm47YjorVNsf4qmrW7uLxyvjo`.
4. **Tailwind v4**: Đây là phiên bản mới nhất, không dùng PostCSS config truyền thống. Cú pháp `@import "tailwindcss"` thay cho `@tailwind base/components/utilities`.
