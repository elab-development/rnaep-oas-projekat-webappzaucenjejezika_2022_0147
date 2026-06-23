import CourseCard from './CourseCard';

export default function LanguageSection({ language, courses }) {
  if (!courses.length) return null;

  return (
    <section className='mb-10'>
      {/* Header */}
      <div className='flex items-center gap-3 mb-4'>
        <img
          src={language.imgUrl}
          alt={language.name}
          className='h-8 w-8 rounded-full object-cover shadow-sm'
        />

        <h2 className='text-lg font-extrabold text-gray-900'>
          {language.name}
        </h2>

        <div className='flex-1 h-px bg-gray-200 ml-2' />
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
