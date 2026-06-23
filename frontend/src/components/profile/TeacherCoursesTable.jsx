import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export default function TeacherCoursesTable({ courses }) {
  if (!courses.length) {
    return (
      <div className='text-gray-500 text-sm'>
        You are not teaching any courses.
      </div>
    );
  }

  return (
    <div className='rounded-3xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden'>
      <div className='px-4 py-3  font-extrabold text-gray-900 flex items-center gap-2'>
        <GraduationCap size={18} />
        Courses you teach
      </div>

      <table className='w-full text-sm'>
        <thead className='bg-gray-50 text-gray-600'>
          <tr>
            <th className='text-left px-4 py-2'>Course</th>
            <th className='text-left px-4 py-2'>Action</th>
          </tr>
        </thead>

        <tbody>
          {courses.map((course) => (
            <tr key={course.id} className=''>
              <td className='px-4 py-2 font-bold'>{course.title}</td>

              <td className='px-4 py-2'>
                <Link
                  to={`/course/${course.id}`}
                  className='
                  text-green-600
                  font-bold
                  hover:underline
                  '
                >
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
