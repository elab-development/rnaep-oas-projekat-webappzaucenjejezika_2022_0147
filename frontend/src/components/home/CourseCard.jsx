import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';

export default function CourseCard({ course }) {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);

  const handleClick = () => {
    if (!token) {
      navigate('/login');
      return;
    }

    navigate(`/course/${course.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className='
        group cursor-pointer
        rounded-3xl bg-white p-5
        shadow-sm ring-1 ring-black/5
        hover:shadow-md hover:ring-green-200
        transition
      '
    >
      {/* Top */}
      <div className='flex items-start justify-between'>
        <div className='flex items-center gap-2 text-green-700'>
          <BookOpen className='h-5 w-5' />
          <span className='text-xs font-bold uppercase'>{course.level}</span>
        </div>

        <ChevronRight className='h-5 w-5 text-gray-400 group-hover:text-green-600 transition' />
      </div>

      {/* Title */}
      <h3 className='mt-3 font-extrabold text-gray-900 text-sm leading-tight'>
        {course.title}
      </h3>

      {/* Language */}
      {course.language && (
        <div className='mt-3 flex items-center gap-2'>
          <img
            src={course.language.imgUrl}
            alt={course.language.name}
            className='h-5 w-5 rounded-full object-cover'
          />
          <span className='text-xs font-bold text-gray-600'>
            {course.language.name}
          </span>
        </div>
      )}
    </div>
  );
}
