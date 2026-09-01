import './globals.css';
import { I18nProvider } from '../lib/i18n/I18nProvider';

export const metadata = {
  title: 'CivilVerify — Construction Monitoring & Work Verification',
  description: 'AI-assisted construction monitoring, quality check and work verification for rural housing projects.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
