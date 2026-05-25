import { Route, Routes } from 'react-router-dom';
import SchoolLayout from './SchoolLayout';
import SchoolDashboard from './pages/SchoolDashboard';
import SchoolLevels from './pages/SchoolLevels';
import SchoolLibrary from './pages/SchoolLibrary';
import SchoolMapping from './pages/SchoolMapping';

/**
 * AppSchool — mini-router mounted at /school/*. Lives entirely under
 * `src/school/` so the eventual split into a separate Vite app is a
 * matter of lifting this directory + its data dependencies.
 *
 * Currently a static preview: routes show the 8-level structure, book
 * remap, and curriculum mapping. Phase 4 will add an interactive
 * assessment; Phase 5 will wire the interactive reader.
 */
export default function AppSchool() {
  return (
    <Routes>
      <Route element={<SchoolLayout />}>
        <Route index element={<SchoolDashboard />} />
        <Route path="levels" element={<SchoolLevels />} />
        <Route path="library" element={<SchoolLibrary />} />
        <Route path="mapping" element={<SchoolMapping />} />
      </Route>
    </Routes>
  );
}
