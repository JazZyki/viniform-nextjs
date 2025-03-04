import "../styles/global.scss";

export const metadata = {
  title: "ViniForm - Zakázkový list",
  description: "Created by Jakub Zykl",
};

export default function RootLayout({ children }) {
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
        </div>
      </body>
    </html>
  );
}
