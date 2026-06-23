import { useEffect } from 'react';
import { useEnrollmentStore } from '../../stores/useEnrollmentStore';
import { useAuthStore } from '../../stores/useAuthStore';

import CourseCard from './CourseCard';

import { BookOpen, Loader2 } from 'lucide-react';

export default function MyCoursesSection() {
  const user = useAuthStore((s) => s.user);

  if (user?.role !== 'student') return null;

  const enrollments = useEnrollmentStore((s) => s.enrollments);
  const fetchEnrollments = useEnrollmentStore((s) => s.fetchEnrollments);
  const loading = useEnrollmentStore((s) => s.loading);

  useEffect(() => {
    if (user) {
      fetchEnrollments();
    }
  }, [user]);

  if (!user) return null;

  if (loading) {
    return (
      <div className='mb-10 flex justify-center'>
        <Loader2 className='h-6 w-6 animate-spin text-green-600' />
      </div>
    );
  }

  if (!enrollments.length) return null;

  const courses = enrollments.map((e) => ({
    id: e.course_id,
    title: e.course_title,
    level: e.level,
    language: e.language,
  }));

  return (
    <section className='mb-12'>
      {/* Header */}
      <div className='flex items-center gap-3 mb-4'>
        <div className='flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-xl shadow-sm'>
          <BookOpen className='h-4 w-4' />
          <span className='text-sm font-extrabold'>My Courses</span>
        </div>

        <div className='flex-1 h-px bg-gray-200' />
      </div>

      {/* Courses */}
      <div
        className='
        grid
        grid-cols-1
        sm:grid-cols-2
        md:grid-cols-3
        lg:grid-cols-4
        gap-4
      '
      >
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </section>
  );
}
