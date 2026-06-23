import { Outlet } from 'react-router-dom';
import Navbar from '../components/shared/Navbar';

export default function AppLayout() {
  return (
    <div className='min-h-screen bg-linear-to-b from-green-50 to-white'>
      <Navbar />

      <main className='mx-auto w-full max-w-6xl px-4 py-6'>
        <div className='rounded-3xl bg-white/80 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur sm:p-6'>
          <Outlet />
        </div>
      </main>

      <footer className='mx-auto w-full max-w-6xl px-4 pb-8'>
        <div className='mt-6 rounded-3xl bg-white/80 px-4 py-3 text-sm text-gray-500 shadow-sm ring-1 ring-black/5'>
          © {new Date().getFullYear()} Duolingo — MVP
        </div>
      </footer>
    </div>
  );
}
