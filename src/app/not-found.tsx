import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="font-serif text-[64px] leading-none text-accent">404</p>
      <h1 className="mt-4 font-serif text-2xl">Bu parça artık vitrinde değil</h1>
      <p className="mt-2 text-[15px] text-ink-soft">Belki kaldırıldı ya da link hatalı. Vitrinde başka güzellikler var.</p>
      <Link
        href="/"
        className="mt-8 inline-flex h-12 items-center rounded-full bg-accent px-6 text-[15px] font-semibold text-accent-ink"
      >
        Vitrine dön
      </Link>
    </main>
  );
}
