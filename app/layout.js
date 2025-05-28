import "../styles/global.scss";
import usePWAInstall from "../components/PWAInstall";

const APP_NAME = "Viniform";
const APP_DEFAULT_TITLE = "ViniForm - Zakázkový list";
const APP_TITLE_TEMPLATE = "%s - PWA App";
const APP_DESCRIPTION = "Zakázkový list pro ViniCars, created by Jakub Zykl";

export const metadata = {
  applicationName: APP_NAME,
  // appleMobileWebAppTitle: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
};

export const viewport = {
  themeColor: "#FFFFFF",
};

export default function RootLayout({ children }) {
  const { installable, installPWA } = usePWAInstall();
  return (
    <html lang="cs">
      <body>
        <div className="min-h-screen max-w-md m-auto bg-white">
          <div>
            <img src="../logo.png" alt="VinicarsLogo" width={100} className="pt-8 w-[90%] m-auto" />
            <h1 className="text-4xl pb-2 border-b-4 border-maingreen">Zakázkový list</h1>
          </div>
          <div className="p-4">
            {children}
          </div>
          {installable && (
            <button
              className="fixed bottom-4 right-4 bg-maingreen text-white p-2 rounded"
              onClick={installPWA}
            >
              Instalovat aplikaci do telefonu
            </button>
          )}
        </div>
      </body>
    </html>
  );
}
