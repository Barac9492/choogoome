/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

export const dynamic = "force-dynamic";

type EssayPreview = {
  title?: string;
  createdAt?: { toDate: () => Date } | null;
};

export default async function EssayList() {
  const q = query(
    collection(firestore, "essays"),
    where("public", "==", true),
    orderBy("createdAt", "desc"),
    limit(20)
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    return (
      <p className="p-6 text-center">아직 게시된 이야기가 없습니다.</p>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-serif font-bold mb-6">최근 이야깃거리</h1>
      <ul className="space-y-4">
        {snap.docs.map((doc) => {
          const d = doc.data() as EssayPreview;
          return (
            <li key={doc.id}>
              <Link href={`/essay/${doc.id}`} className="text-lg font-medium hover:underline">
                {d.title || "Untitled"}
                {d.createdAt && (
                  <span className="text-gray-400 text-sm ml-1">
                    ({d.createdAt.toDate().toLocaleDateString()})
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
