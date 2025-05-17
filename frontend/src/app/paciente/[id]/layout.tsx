import BallBackground from "@/app/components/ui/BallBackgound";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section>
      <BallBackground />
      {children}
    </section>
  );
}
