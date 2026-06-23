import { BrowserRouter, Routes, Route } from 'react-router-dom';

import AppLayout from './layout/AppLayout';

import AuthRoute from './components/auth/AuthRoute';
import GuestRoute from './components/auth/GuestRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import CourseDetails from './pages/CourseDetails';
import LessonDetails from './pages/LessonDetails';
import Translate from './pages/Translate';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path='/' element={<Home />} />

          <Route element={<GuestRoute />}>
            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />
          </Route>

          <Route element={<AuthRoute />}>
            <Route path='/profile' element={<Profile />} />
            <Route path='/course/:courseId' element={<CourseDetails />} />
            <Route path='/lesson/:lessonId' element={<LessonDetails />} />
            <Route path='/translate' element={<Translate />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
