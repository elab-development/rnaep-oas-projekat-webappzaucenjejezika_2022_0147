import { useEnrollmentStore } from '../../stores/useEnrollmentStore';
import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';

export default function EnrollSection({ courseId, lessonsCount }) {
  const createEnrollment = useEnrollmentStore((s) => s.createEnrollment);
  const loading = useEnrollmentStore((s) => s.loading);

  const [success, setSuccess] = useState(false);

  async function handleEnroll() {
    await createEnrollment(courseId);
    setSuccess(true);
  }

  if (success) {
    return (
      <div className='bg-green-50 p-4 rounded-2xl text-green-700 font-bold'>
        Enrollment request sent.
      </div>
    );
  }

  return (
    <div className='bg-white rounded-2xl shadow-sm p-6 border border-black/5'>
      <div className='mb-3 text-gray-600'>
        This course has <b>{lessonsCount}</b> lessons.
      </div>

      <button
        onClick={handleEnroll}
        disabled={loading}
        className='
          bg-green-600
          text-white
          px-4 py-2
          rounded-xl
          font-bold
          hover:bg-green-700
          flex items-center gap-2
        '
      >
        {loading ? (
          <Loader2 className='animate-spin' size={16} />
        ) : (
          <Plus size={16} />
        )}
        Enroll
      </button>
    </div>
  );
}
