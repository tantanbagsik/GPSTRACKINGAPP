import './globals.css';

export const metadata = {
  title: 'RP Motor Tracking',
  description: 'Motor Vehicle Tracking Application',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav className="navbar">
          <div className="nav-brand">RP Motor Tracking</div>
          <div className="nav-links">
            <a href="/">Dashboard</a>
            <a href="/vehicles">Vehicles</a>
            <a href="/admin">Admin</a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
