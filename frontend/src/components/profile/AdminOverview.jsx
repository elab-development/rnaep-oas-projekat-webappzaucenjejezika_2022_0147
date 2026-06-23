import { useEffect, useMemo } from 'react';
import { Loader2, BarChart3, Users, BookOpen, Languages } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

import { useAdminStatsStore } from '../../stores/useAdminStatsStore';

const CHART_COLORS = [
  '#16a34a',
  '#22c55e',
  '#34d399',
  '#10b981',
  '#84cc16',
  '#0ea5e9',
];

function EmptyState({ text }) {
  return <div className='mt-3 text-sm text-gray-600'>{text}</div>;
}

function Card({ title, children, right }) {
  return (
    <div className='rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5'>
      <div className='flex items-center justify-between gap-3'>
        <div className='text-sm font-extrabold text-gray-900'>{title}</div>
        {right}
      </div>
      <div className='mt-4'>{children}</div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }) {
  return (
    <div className='rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5'>
      <div className='flex items-center justify-between'>
        <div>
          <div className='text-xs font-bold text-gray-500'>{label}</div>
          <div className='mt-2 text-2xl font-extrabold text-gray-900'>
            {value ?? 0}
          </div>
        </div>
        <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-green-700 ring-1 ring-green-100'>
          <Icon className='h-5 w-5' />
        </div>
      </div>
    </div>
  );
}

export default function AdminOverview() {
  const fetchStats = useAdminStatsStore((s) => s.fetchStats);
  const stats = useAdminStatsStore((s) => s.stats);
  const loading = useAdminStatsStore((s) => s.loading);
  const error = useAdminStatsStore((s) => s.error);
  const clearError = useAdminStatsStore((s) => s.clearError);

  useEffect(() => {
    fetchStats().catch(() => {});
  }, [fetchStats]);

  const kpis = stats?.kpis;

  const coursesByLanguage = useMemo(
    () => stats?.courses_by_language || [],
    [stats],
  );
  const coursesByLevel = useMemo(() => stats?.courses_by_level || [], [stats]);
  const enrollmentsByStatus = useMemo(
    () => stats?.enrollments_by_status || [],
    [stats],
  );
  const lessonsPerMonth = useMemo(
    () => stats?.lessons_per_month || [],
    [stats],
  );
  const topCourses = useMemo(
    () => stats?.top_courses_by_enrollments || [],
    [stats],
  );

  return (
    <div className='mt-6 space-y-6'>
      <div className='rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5'>
        <div className='inline-flex items-center gap-2 rounded-2xl bg-green-50 px-3 py-2 text-sm font-bold text-green-800'>
          <BarChart3 className='h-4 w-4' />
          ADMIN OVERVIEW
        </div>
        <h2 className='mt-3 text-xl font-extrabold text-gray-900'>
          Dashboard statistics
        </h2>
        <p className='mt-1 text-sm text-gray-600'>
          Quick insights for courses, users, enrollments and lessons.
        </p>

        {error && (
          <div className='mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 ring-1 ring-red-100'>
            {error}
            <button
              className='ml-3 underline'
              onClick={() => {
                clearError();
                fetchStats().catch(() => {});
              }}
              type='button'
            >
              Retry
            </button>
          </div>
        )}

        {loading && (
          <div className='mt-6 flex justify-center py-6'>
            <Loader2 className='h-6 w-6 animate-spin text-green-600' />
          </div>
        )}
      </div>

      {/* KPI grid */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Kpi icon={Users} label='Total users' value={kpis?.users_total} />
        <Kpi icon={Languages} label='Languages' value={kpis?.languages} />
        <Kpi icon={BookOpen} label='Courses' value={kpis?.courses} />
        <Kpi icon={BarChart3} label='Enrollments' value={kpis?.enrollments} />
      </div>

      {/* Charts */}
      <div className='grid gap-4 lg:grid-cols-2'>
        {/* Courses by language */}
        <Card title='Courses by language'>
          {!coursesByLanguage.length ? (
            <EmptyState text='No data available.' />
          ) : (
            <div className='h-80'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={coursesByLanguage}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='label' tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey='value'
                    name='Courses'
                    fill={CHART_COLORS[0]}
                    radius={[12, 12, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Enrollments by status */}
        <Card title='Enrollments by status'>
          {!enrollmentsByStatus.length ? (
            <EmptyState text='No data available.' />
          ) : (
            <div className='h-80'>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Tooltip />
                  <Legend />
                  <Pie
                    data={enrollmentsByStatus}
                    dataKey='value'
                    nameKey='label'
                    cx='50%'
                    cy='50%'
                    outerRadius={110}
                  >
                    {enrollmentsByStatus.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Courses by level */}
        <Card title='Courses by level'>
          {!coursesByLevel.length ? (
            <EmptyState text='No data available.' />
          ) : (
            <div className='h-80'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={coursesByLevel}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='label' />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey='value'
                    name='Courses'
                    fill={CHART_COLORS[3]}
                    radius={[12, 12, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Lessons per month */}
        <Card title='Lessons per month'>
          {!lessonsPerMonth.length ? (
            <EmptyState text='No data available.' />
          ) : (
            <div className='h-80'>
              <ResponsiveContainer width='100%' height='100%'>
                <LineChart data={lessonsPerMonth}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='label' />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type='monotone'
                    dataKey='value'
                    name='Lessons'
                    stroke={CHART_COLORS[1]}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Top courses */}
        <div className='lg:col-span-2'>
          <Card title='Top courses by enrollments'>
            {!topCourses.length ? (
              <EmptyState text='No data available.' />
            ) : (
              <div className='h-96'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={topCourses}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis
                      dataKey='label'
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={-10}
                      height={60}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey='value'
                      name='Enrollments'
                      fill={CHART_COLORS[2]}
                      radius={[12, 12, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
