import { useEffect, useState } from 'react';

export default function LessonModal({ open, onClose, onSave, lesson }) {
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title);
    } else {
      setTitle('');
    }
  }, [lesson]);

  if (!open) return null;

  function submit() {
    onSave({
      title,
      starts_at: new Date().toISOString(),
    });

    onClose();
  }

  return (
    <div
      className='
      fixed inset-0
      bg-black/40
      flex items-center justify-center
      z-50
    '
    >
      <div
        className='
        bg-white
        p-6
        rounded-3xl
        w-96
        shadow-lg
      '
      >
        <h2 className='font-extrabold mb-4'>
          {lesson ? 'Edit Lesson' : 'Create Lesson'}
        </h2>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='Lesson title'
          className='
            w-full
            shadow-sm
            rounded-2xl
            px-3 py-2
            mb-3
          '
        />

        <div className='flex gap-2 mt-4'>
          <button
            onClick={submit}
            className='
              flex-1
              bg-green-600
              text-white
              rounded-2xl
              py-2
              font-bold
              hover:bg-green-700
            '
          >
            Save
          </button>

          <button
            onClick={onClose}
            className='
              flex-1
              bg-gray-100
              rounded-2xl
              py-2
              font-bold
            '
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
