import { Link } from 'react-router-dom';

export default function StudentCoursesTable({ enrollments }) {
  if (!enrollments?.length) return <div>No courses yet.</div>;

  return (
    <div className='mt-6 rounded-3xl bg-white p-4 shadow-md ring-1 ring-black/5'>
      <div className='mb-3 text-sm font-extrabold text-gray-900'>
        My courses
      </div>

      <div className='overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-left text-gray-500'>
              <th className='py-2 pr-4'>Course</th>
              <th className='py-2 pr-4'>Status</th>
              <th className='py-2'>Action</th>
            </tr>
          </thead>

          <tbody className='text-gray-900'>
            {enrollments.map((e) => (
              <tr key={e.id} className='border-t border-black/5'>
                <td className='py-3 pr-4 font-bold'>
                  {e.course?.title ??
                    e.course_title ??
                    `Course #${e.course_id}`}
                </td>

                <td className='py-3 pr-4'>
                  <span className='rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-800'>
                    {e.status}
                  </span>
                </td>

                <td className='py-3'>
                  <Link
                    to={`/course/${e.course_id}`}
                    className='inline-flex items-center justify-center rounded-2xl bg-green-600 px-4 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-green-700'
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
