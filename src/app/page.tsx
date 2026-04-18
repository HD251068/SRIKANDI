// src/app/page.tsx
import { redirect } from 'next/navigation'

// Root redirect ke login
export default function RootPage() {
  redirect('/login')
}
