import { Link } from 'react-router-dom';
import { Calendar, Clock, Pencil, Trash2 } from 'lucide-react';

export default function LessonCard({ lesson, isTeacher, onEdit, onDelete }) {
  return (
    <div
      className='
      rounded-2xl
      border border-black/5
      bg-white
      p-4
      shadow-sm
      hover:shadow-md
      transition
    '
    >
      {/* Header */}
      <div className='flex justify-between'>
        <Link
          to={`/lesson/${lesson.id}`}
          className='font-bold text-gray-900 hover:underline'
        >
          {lesson.title}
        </Link>

        {isTeacher && (
          <div className='flex gap-2'>
            <button
              onClick={onEdit}
              className='
                text-green-600
                hover:bg-green-50
                p-1
                rounded-lg
              '
            >
              <Pencil size={16} />
            </button>

            <button
              onClick={onDelete}
              className='
                text-red-600
                hover:bg-red-50
                p-1
                rounded-lg
              '
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
