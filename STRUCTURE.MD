dashboard_kpi/
├── app/                        # Next.js App Router (Routing & Pages)
│   ├── (auth)/                 # Group route cho Đăng nhập/Đăng ký (nếu có)
│   │   └── login/page.tsx
│   ├── (dashboard)/            # Group route cho khu vực Dashboard chính
│   │   ├── layout.tsx          # Chứa Sidebar (Pulse) và Topbar (Alex Tran) chung
│   │   ├── page.tsx            # Trang Dashboard chính (Tổng quan KPIs, Biểu đồ)
│   │   ├── projects/page.tsx   # Trang quản lý Projects
│   │   ├── kpis/page.tsx       # Trang quản lý chi tiết KPIs
│   │   └── weekly-reports/     # Trang báo cáo hàng tuần
│   │       └── page.tsx
│   ├── api/                    # Các API Route phục vụ nội bộ (nếu cần)
│   ├── favicon.ico
│   ├── globals.css             # Cấu hình Tailwind CSS toàn cục
│   └── layout.tsx              # Root Layout (Cấu hình Font, Provider...)
├── components/                 # UI Components dùng chung toàn hệ thống
│   ├── ui/                     # Nguyên tử UI cơ bản (Button, Card, Badge - ví dụ từ shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── progress.tsx
│   ├── charts/                 # Các component biểu đồ (Dùng Recharts hoặc Chart.js)
│   │   └── weekly-activity.tsx # Biểu đồ cột đôi "Weekly task activity"
│   ├── sidebar.tsx             # Thanh menu điều hướng bên trái (Pulse workspace)
│   └── user-nav.tsx            # Component góc trên bên phải (Profile Alex Tran)
├── hooks/                      # Custom hooks xử lý logic tái sử dụng (useAuth, useFetch...)
├── lib/                        # Thư viện hoặc cấu hình công cụ kết nối
│   ├── utils.ts                # Hàm helper (ví dụ: cn để merge class Tailwind)
│   └── db.ts                   # Cấu hình kết nối Database / Google Sheets API (nếu có)
├── public/                     # Tài nguyên tĩnh (Images, SVGs, Icons)
├── types/                      # Định nghĩa TypeScript (Project, KPI, Task...)
├── package.json
└── tailwind.config.ts          # Cấu hình Theme Dark Mode giống trong thiết kế