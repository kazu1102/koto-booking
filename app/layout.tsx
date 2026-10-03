import type { Metadata } from 'next';
import './style.css';
export const metadata: Metadata = { title: '鍼灸整体院 琴｜ネット予約', description: '鍼灸整体院 琴のオンライン予約' };
export default function RootLayout({children}:{children:React.ReactNode}) {
 return <html lang="ja"><body>{children}</body></html>;
}
