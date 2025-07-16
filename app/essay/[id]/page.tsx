"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { firestore } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface EssayDoc {
  title: string;
  fullEssay: string;
  hashtags?: string[];
  likeCount?: number;
}

export default function EssayPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<EssayDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEssay() {
      if (!id) return;
      const snap = await getDoc(doc(firestore, "essays", id));
      if (snap.exists()) {
        setData(snap.data() as EssayDoc);
      }
      setLoading(false);
    }
    fetchEssay();
  }, [id]);

  if (loading) return <p className="p-6 text-center">Loading...</p>;
  if (!data) return <p className="p-6 text-center">Essay not found.</p>;

  return (
    <article className="max-w-3xl mx-auto px-4 py-10 prose">
      <h1>{data.title}</h1>
      {data.fullEssay.split("\n\n").map((para, idx) => (
        <p key={idx}>{para}</p>
      ))}
      {data.hashtags && data.hashtags.length > 0 && (
        <p className="mt-8 text-sm text-gray-500">
          {data.hashtags.map((tag) => `#${tag}`).join(" ")}
        </p>
      )}
    </article>
  );
}
