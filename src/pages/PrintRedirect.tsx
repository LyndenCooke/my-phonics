import { Navigate, useParams } from 'react-router-dom';

/**
 * /b/* — the permanent targets of every QR code printed inside a book.
 *
 * THESE PATHS ARE ON PAPER. Books shipped to libraries and classrooms carry
 * these URLs as QR codes, and a printed code can never be reissued. So the
 * contract is one-way:
 *
 *   - The /b/... paths themselves must NEVER change, be renamed, or be
 *     removed. They are frozen the moment a book is printed.
 *   - Where they redirect to is free to change forever. That is the whole
 *     point of the indirection: the app can be re-routed or rebuilt and
 *     every book already in the field keeps working.
 *
 * The printed strings live in myphonics_books/data/print_qr_registry.json and
 * are verified against the rendered PDFs by audit_release.check_printed_qrs().
 * If you add a path here, add it there too — and vice versa.
 *
 * Scanners are usually strangers holding a borrowed copy with no account, so
 * the destinations must degrade gracefully rather than dead-ending on a
 * paywall: /library shows the book and prompts for the printed pass code
 * (LIBRARY-READERS), which unlocks reading through the same teacher-session
 * flow as the TPT-TEACHERS pass.
 */
export default function PrintRedirect({ target }: { target: 'book' | 'worksheets' | 'check' | 'library' }) {
  const { id } = useParams<{ id: string }>();

  switch (target) {
    case 'book':
      // ?book=<id> is consumed by /library, which opens the reader directly.
      return <Navigate to={`/library?book=${encodeURIComponent(id ?? '')}&src=print`} replace />;
    case 'worksheets':
      return <Navigate to={`/library?book=${encodeURIComponent(id ?? '')}&tab=worksheets&src=print`} replace />;
    case 'check':
      return <Navigate to="/assessment?src=print" replace />;
    case 'library':
    default:
      return <Navigate to="/library?src=print" replace />;
  }
}
