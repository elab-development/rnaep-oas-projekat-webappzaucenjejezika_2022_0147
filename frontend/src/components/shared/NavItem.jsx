import { NavLink } from 'react-router-dom';

export function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        [
          'flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition',
          'hover:bg-green-50 hover:text-green-700',
          isActive ? 'bg-green-100 text-green-800 shadow-sm' : 'text-gray-700',
        ].join(' ')
      }
    >
      <Icon className='h-4 w-4' />
      <span>{label}</span>
    </NavLink>
  );
}
