import { redirect } from 'next/navigation'

// Root path redirects to marketplace (middleware handles auth check)
export default function RootPage() {
  redirect('/marketplace')
}
