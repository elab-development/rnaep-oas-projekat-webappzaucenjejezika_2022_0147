import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

import { useAuthStore } from '../stores/useAuthStore';
import { useEnrollmentStore } from '../stores/useEnrollmentStore';
import { useCourseStore } from '../stores/useCourseStore';

import ProfileHeader from '../components/profile/ProfileHeader';
import StudentCoursesTable from '../components/profile/StudentCoursesTable';
import TeacherCoursesTable from '../components/profile/TeacherCoursesTable';
import AdminOverview from '../components/profile/AdminOverview';

export default function Profile() {
  const user = useAuthStore((s) => s.user);

  // STUDENT
  const fetchEnrollments = useEnrollmentStore((s) => s.fetchEnrollments);
  const enrollments = useEnrollmentStore((s) => s.enrollments);
  const enrollmentLoading = useEnrollmentStore((s) => s.loading);

  // TEACHER
  const fetchTeacherCourses = useCourseStore((s) => s.fetchCoursesByTeacher);
  const teacherCourses = useCourseStore((s) => s.teacherCourses);
  const courseLoading = useCourseStore((s) => s.loading);

  const loading = enrollmentLoading || courseLoading;

  useEffect(() => {
    if (!user) return;

    if (user.role === 'student') {
      fetchEnrollments({
        student_id: user.id,
        per_page: 100,
      }).catch(() => {});
    }

    if (user.role === 'teacher') {
      fetchTeacherCourses(user.id).catch(() => {});
    }
  }, [user, fetchEnrollments, fetchTeacherCourses]);

  if (!user) return null;

  return (
    <div className='max-w-5xl mx-auto'>
      <ProfileHeader user={user} />

      {loading && (
        <div className='flex justify-center py-10'>
          <Loader2 className='h-6 w-6 animate-spin text-green-600' />
        </div>
      )}

      {/* STUDENT */}
      {user.role === 'student' && !loading && (
        <StudentCoursesTable enrollments={enrollments} />
      )}

      {/* TEACHER */}
      {user.role === 'teacher' && !loading && (
        <TeacherCoursesTable courses={teacherCourses} />
      )}

      {/* ADMIN */}
      {user.role === 'admin' && <AdminOverview />}
    </div>
  );
}
