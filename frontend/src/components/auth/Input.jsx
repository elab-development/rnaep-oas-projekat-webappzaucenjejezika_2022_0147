export function Input({
  icon,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}) {
  return (
    <div>
      <label className='block text-sm font-bold mb-1'>{label}</label>

      <div className='flex items-center gap-2 rounded-2xl border border-black/10 px-3 py-2 shadow-sm focus-within:ring-4 focus-within:ring-green-100'>
        {icon}

        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className='w-full outline-none text-sm font-semibold'
        />
      </div>
    </div>
  );
}
