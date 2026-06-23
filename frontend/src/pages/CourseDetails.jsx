import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

import { useCourseStore } from '../stores/useCourseStore';
import { useLessonStore } from '../stores/useLessonStore';
import { useEnrollmentStore } from '../stores/useEnrollmentStore';
import { useAuthStore } from '../stores/useAuthStore';

import LessonsSection from '../components/courses/LessonsSection';
import EnrollSection from '../components/courses/EnrollSection';
import StudentsAccordion from '../components/courses/StudentsAccordion';
import LessonModal from '../components/courses/LessonModal';
import { Loader2 } from 'lucide-react';

export default function CourseDetails() {
  const { courseId } = useParams();

  const user = useAuthStore((s) => s.user);

  const course = useCourseStore((s) => s.currentCourse);
  const fetchCourse = useCourseStore((s) => s.fetchCourse);

  const lessons = useLessonStore((s) => s.lessons);
  const fetchLessons = useLessonStore((s) => s.fetchLessons);

  const enrollments = useEnrollmentStore((s) => s.enrollments);
  const fetchEnrollments = useEnrollmentStore((s) => s.fetchEnrollments);

  const updateStatus = useEnrollmentStore((s) => s.updateEnrollmentStatus);

  const createLesson = useLessonStore((s) => s.createLesson);
  const updateLesson = useLessonStore((s) => s.updateLesson);
  const deleteLesson = useLessonStore((s) => s.deleteLesson);

  const courseLoading = useCourseStore((s) => s.loading);
  const lessonLoading = useLessonStore((s) => s.loading);
  const enrollmentLoading = useEnrollmentStore((s) => s.loading);

  const loading = courseLoading || lessonLoading || enrollmentLoading;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);

  useEffect(() => {
    fetchCourse(courseId);

    fetchLessons({
      course_id: courseId,
    });

    fetchEnrollments({
      course_id: courseId,
    });
  }, []);

  if (!course) return null;

  if (loading) {
    return (
      <div className='flex justify-center py-20'>
        <Loader2 className='h-8 w-8 animate-spin text-green-600' />
      </div>
    );
  }

  const isTeacher = user?.role === 'teacher';
  const isOwner = isTeacher && course.teacher_id === user.id;

  const myEnrollment = enrollments.find(
    (e) => e.course_id === Number(courseId),
  );

  const isStudentEnrolled = !!myEnrollment;

  return (
    <div className='max-w-5xl mx-auto'>
      <h1 className='text-2xl font-bold mb-4'>{course.title}</h1>

      {/* STUDENT */}
      {user?.role === 'student' && !isStudentEnrolled && (
        <EnrollSection courseId={courseId} lessonsCount={lessons.length} />
      )}

      {/* STUDENT ENROLLED */}
      {user?.role === 'student' && isStudentEnrolled && (
        <LessonsSection
          lessons={lessons}
          isTeacher={isOwner}
          onEdit={(lesson) => {
            setEditingLesson(lesson);
            setModalOpen(true);
          }}
          onDelete={deleteLesson}
        />
      )}

      {/* TEACHER */}
      {isTeacher && isOwner && (
        <>
          <button
            onClick={() => {
              setEditingLesson(null);
              setModalOpen(true);
            }}
            className='
              mb-6
              flex items-center gap-2
              rounded-2xl
              bg-green-600
              px-4 py-2
              text-sm font-bold text-white
              shadow-sm
              transition
              hover:bg-green-700
            '
          >
            Create Lesson
          </button>

          <LessonsSection
            lessons={lessons}
            isTeacher={isOwner}
            onEdit={(lesson) => {
              setEditingLesson(lesson);
              setModalOpen(true);
            }}
            onDelete={deleteLesson}
          />

          <StudentsAccordion
            enrollments={enrollments}
            updateStatus={updateStatus}
          />
        </>
      )}

      {/* NOT OWNER TEACHER */}
      {isTeacher && !isOwner && (
        <div className='text-red-600 font-bold'>This is not your course.</div>
      )}

      <LessonModal
        open={modalOpen}
        lesson={editingLesson}
        onClose={() => setModalOpen(false)}
        onSave={(data) => {
          if (editingLesson) {
            updateLesson(editingLesson.id, data);
          } else {
            createLesson({
              ...data,
              course_id: courseId,
            });
          }
        }}
      />
    </div>
  );
}
