import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-16">
      <section className="space-y-6">
        <p className="inline-block rounded-full bg-red-100 px-4 py-1 text-sm font-medium text-red-700">
          Welcome to Mõ Sushi
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-brand-dark sm:text-5xl">
          Fresh sushi made every day.
        </h1>
        <p className="max-w-2xl text-lg text-zinc-700">
          Explore our handcrafted menu with premium ingredients and balanced flavors.
        </p>
        <Link
          href="/menu"
          className="inline-flex items-center rounded-md bg-brand-dark px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          View Menu
        </Link>
      </section>
    </main>
  );
}
