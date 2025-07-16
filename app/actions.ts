"use server";
import { firestore } from "@/lib/firebase";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";


export async function generateEssay(formData: FormData) {
  const posts = String(formData.get("posts"));
  const birthdate = String(formData.get("birthdate"));
  // Very naive AI stub: just combines posts. In production replace with Claude/Gemini call.
  const paragraphs = posts
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const fullEssay = paragraphs.join("\n\n");
  const title = paragraphs[0]?.slice(0, 30) || "Untitled Essay";

  const essayRef = doc(collection(firestore, "essays"));
  const data = {
    sourcePosts: posts,
    fullEssay,
    title,
    hashtags: [],
    authorBirthdate: birthdate,
    authorId: null,
    createdAt: serverTimestamp(),
    public: true,
    likeCount: 0,
  };

  await setDoc(essayRef, data);

  revalidatePath(`/essay/${essayRef.id}`);
  redirect(`/essay/${essayRef.id}`);
}
