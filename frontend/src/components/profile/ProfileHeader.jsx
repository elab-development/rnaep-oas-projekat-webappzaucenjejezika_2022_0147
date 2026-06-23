import { Mail, Shield } from 'lucide-react';

export default function ProfileHeader({ user }) {
  return (
    <div
      className='
      rounded-3xl
      bg-white
      p-6
      shadow-sm
      ring-1 ring-black/5
      mb-6
    '
    >
      <div className='flex items-center gap-4'>
        {/* Avatar */}
        <div
          className='
          h-16 w-16
          rounded-3xl
          bg-green-500
          flex items-center justify-center
          text-white font-extrabold text-xl
          shadow-sm
        '
        >
          {user.name.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className='flex-1'>
          <h1 className='text-xl font-extrabold text-gray-900'>{user.name}</h1>

          <div className='mt-1 flex flex-col gap-1 text-sm text-gray-600'>
            <div className='flex items-center gap-2'>
              <Mail size={16} />
              {user.email}
            </div>

            <div className='flex items-center gap-2'>
              <Shield size={16} />
              Role: <span className='font-bold capitalize'>{user.role}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
