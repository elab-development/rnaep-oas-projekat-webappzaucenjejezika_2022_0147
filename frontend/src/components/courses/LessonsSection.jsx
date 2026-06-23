import LessonCard from './LessonCard';

export default function LessonsSection({
  lessons,
  isTeacher,
  onEdit,
  onDelete,
}) {
  if (!lessons.length) {
    return <div className='text-sm text-gray-500'>No lessons yet.</div>;
  }

  return (
    <div
      className='
      grid
      sm:grid-cols-2
      lg:grid-cols-3
      gap-4
    '
    >
      {lessons.map((lesson) => (
        <LessonCard
          key={lesson.id}
          lesson={lesson}
          isTeacher={isTeacher}
          onEdit={() => onEdit(lesson)}
          onDelete={() => onDelete(lesson.id)}
        />
      ))}
    </div>
  );
}
