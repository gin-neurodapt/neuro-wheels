import { BRAND } from '../wheels/pages.js';

// The footer: the NeuroDapt logo, large, linking to the main website.
export function SiteFooter({ logoUrl }) {
  return (
    <footer className="site-footer">
      <a className="footer-brand" href={BRAND.url} target="_top" rel="noopener">
        <img src={logoUrl} alt="" width="115" height="79" />
        <span>Visit neurodapt.au</span>
      </a>
      <p>Your scores stay on this device. Nothing is sent anywhere.</p>
      <p>
        Developed by {BRAND.author}, {BRAND.role}, Sydney.
        <br />© {new Date().getFullYear()} {BRAND.name}. All rights reserved.
      </p>
    </footer>
  );
}
