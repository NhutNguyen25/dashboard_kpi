import { redirect } from "next/navigation";

export default function HomePage() {
  // Tự động chuyển hướng người dùng sang trang /dashboard
  redirect("/dashboard");
}