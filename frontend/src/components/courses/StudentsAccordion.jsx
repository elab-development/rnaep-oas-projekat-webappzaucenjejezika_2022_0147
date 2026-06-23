import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function StudentsAccordion({ enrollments, updateStatus }) {
  const [open, setOpen] = useState(false);

  return (
    <div className='mt-4 bg-white rounded-2xl shadow-sm'>
      <button
        onClick={() => setOpen(!open)}
        className='w-full p-4 flex justify-between items-center font-bold'
      >
        Students
        <ChevronDown className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-left text-gray-500'>
              <th className='p-2'>Name</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {enrollments.map((e) => (
              <tr key={e.id}>
                <td className='p-2'>{e.student_name}</td>

                <td>
                  <select
                    value={e.status}
                    onChange={(ev) => updateStatus(e.id, ev.target.value)}
                  >
                    <option value='active'>active</option>
                    <option value='completed'>completed</option>
                    <option value='cancelled'>cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
