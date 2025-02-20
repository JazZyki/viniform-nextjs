import "../styles/global.scss";

export const metadata = {
  title: "ViniForm - Zakázkový list",
  description: "Generated by create next app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen max-w-md m-auto bg-white">
          <div>
            <img src="../public/logo.png" alt="VinicarsLogo" width={100} className="pt-8" />
            <h1 className="text-4xl pb-2 border-b-4 border-maingreen">Zakázkový list</h1>
          </div>
          <div className="p-4">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
