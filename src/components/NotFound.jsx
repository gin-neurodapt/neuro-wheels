import { ALL_PAGES } from '../wheels/pages.js';
import { SiteFooter } from './SiteFooter.jsx';

// The page for an address that does not exist (built as 404.html, which
// Cloudflare Pages serves with a 404 status). Plain links, no app code.
export function NotFound({ logoUrl }) {
  return (
    <div className="page" data-wheel="life">
      <header className="site-header">
        <a className="brand" href="/">
          <img src={logoUrl} alt="NeuroDapt Wheels home" width="115" height="79" />
        </a>
        <h1 className="site-title">Page not found</h1>
      </header>
      <main className="not-found">
        <p>There is no page at this address. Choose a wheel:</p>
        <ul>
          {ALL_PAGES.map((page) => (
            <li key={page.id}>
              <a href={page.path}>{page.wheel.title}</a>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter logoUrl={logoUrl} />
    </div>
  );
}
