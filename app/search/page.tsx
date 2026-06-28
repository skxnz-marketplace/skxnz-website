import { redirect } from "next/navigation";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const rawQuery = params.q;
  const query = Array.isArray(rawQuery) ? rawQuery[0] : rawQuery;

  redirect(query ? `/shop?q=${encodeURIComponent(query)}` : "/shop");
}
