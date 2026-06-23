import { useEffect } from 'react';
import { useLanguageStore } from '../stores/useLanguageStore';
import { useCourseStore } from '../stores/useCourseStore';

import LanguageSection from '../components/home/LanguageSection';
import MyCoursesSection from '../components/home/MyCoursesSection';

import { Loader2, AlertTriangle } from 'lucide-react';

export default function Home() {
  const {
    languages,
    fetchLanguages,
    loading: languagesLoading,
    error: languagesError,
  } = useLanguageStore();

  const {
    courses,
    fetchCourses,
    loading: coursesLoading,
    error: coursesError,
  } = useCourseStore();

  const loading = languagesLoading || coursesLoading;
  const error = languagesError || coursesError;

  useEffect(() => {
    fetchLanguages();
    fetchCourses();
  }, []);

  const coursesByLanguage = languages.map((language) => ({
    language,
    courses: courses.filter((c) => c.language_id === language.id),
  }));

  if (loading) {
    return (
      <div className='flex justify-center py-20'>
        <Loader2 className='h-8 w-8 animate-spin text-green-600' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='max-w-md mx-auto mt-10 rounded-2xl bg-red-50 p-4 text-red-700'>
        <div className='flex gap-2'>
          <AlertTriangle />
          <span className='font-bold'>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-6xl mx-auto'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-2xl font-extrabold text-gray-900'>
          Choose your course
        </h1>

        <p className='text-sm text-gray-600'>Learn languages step by step.</p>
      </div>

      <MyCoursesSection />

      {/* Sections */}
      {coursesByLanguage.map(({ language, courses }) => (
        <LanguageSection
          key={language.id}
          language={language}
          courses={courses}
        />
      ))}
    </div>
  );
}
