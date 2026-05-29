import { Route, Routes } from 'react-router-dom';

// Public-facing surfaces (anyone can hit these).
import SchoolPublicLayout from './SchoolPublicLayout';
import SchoolMarketing from './pages/SchoolMarketing';
import SchoolSignup from './pages/SchoolSignup';
import SchoolSignin from './pages/SchoolSignin';

// Authenticated app surfaces (gated inside SchoolAppLayout).
import SchoolAppLayout from './SchoolAppLayout';
import SchoolAppHome from './pages/SchoolAppHome';
import ClassroomDetail from './pages/ClassroomDetail';
import StudentAssess from './pages/StudentAssess';
import PhonicsGroups from './pages/PhonicsGroups';
import SchoolLibraryAccess from './pages/SchoolLibraryAccess';
import SchoolPathway from './pages/SchoolPathway';
import SchoolMapping from './pages/SchoolMapping';

// Internal preview (still admin-only, mounted at /school/preview/*).
import SchoolLayout from './SchoolLayout';
import SchoolDashboard from './pages/SchoolDashboard';
import SchoolLevels from './pages/SchoolLevels';
import SchoolLibrary from './pages/SchoolLibrary';

/**
 * AppSchool — mini-router mounted at /school/*.
 *
 * Surfaces:
 *   /school                       — public marketing + signup CTA
 *   /school/signup                — admin signup (creates school + binds caller as admin)
 *   /school/signin                — admin/teacher signin
 *   /school/app                   — authenticated dashboard (classroom list)
 *   /school/app/classrooms/:id    — student roster
 *   /school/app/students/:id/assess — per-student assessment
 *   /school/preview/*             — internal 8-level curriculum preview (admin-only,
 *                                   gated upstream in App.tsx via a separate route).
 */
export default function AppSchool() {
  return (
    <Routes>
      <Route element={<SchoolPublicLayout />}>
        <Route index element={<SchoolMarketing />} />
        <Route path="signup" element={<SchoolSignup />} />
        <Route path="signin" element={<SchoolSignin />} />
      </Route>

      <Route element={<SchoolAppLayout />}>
        <Route path="app" element={<SchoolAppHome />} />
        <Route path="app/classrooms" element={<SchoolAppHome />} />
        <Route path="app/classrooms/:id" element={<ClassroomDetail />} />
        <Route path="app/groups" element={<PhonicsGroups />} />
        <Route path="app/pathway" element={<SchoolPathway />} />
        <Route path="app/mapping" element={<SchoolMapping />} />
        <Route path="app/library" element={<SchoolLibraryAccess />} />
        <Route path="app/students/:id/assess" element={<StudentAssess />} />
      </Route>

      <Route element={<SchoolLayout />}>
        <Route path="preview" element={<SchoolDashboard />} />
        <Route path="preview/levels" element={<SchoolLevels />} />
        <Route path="preview/library" element={<SchoolLibrary />} />
        <Route path="preview/mapping" element={<SchoolMapping />} />
      </Route>
    </Routes>
  );
}
