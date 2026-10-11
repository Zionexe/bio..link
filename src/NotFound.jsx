import { PageTitle } from "./Text";
import { Kicker } from "./Motion";

// ---------------------------------------------------------------------------
// NotFound — shown for any link that doesn't match a page.
// ---------------------------------------------------------------------------
export default function NotFound({ onHome }) {
  return (
    <div className="card card-entered pf-card nf-card">
      <div className="hero-block">
        <Kicker text="error — page not found" />
        <PageTitle text="404" />
      </div>
      <p className="nf-text">This page doesn't exist. Or it got ghosted.</p>
      <div className="vn-actions">
        <button type="button" className="vn-btn vn-btn-primary" onClick={onHome}>
          take me home
        </button>
      </div>
    </div>
  );
}
