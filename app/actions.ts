"use server";
import { firestore } from "@/lib/firebase";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import OpenAI from "openai";

export async function generateEssay(formData: FormData) {
  const posts = String(formData.get("posts"));
  const birthdate = String(formData.get("birthdate"));

  // Use OpenAI to turn scattered LinkedIn posts into a cohesive essay.
  // Requires OPENAI_API_KEY environment variable (set in Vercel settings).
  let fullEssay: string;
  let title: string;
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // falls back to gpt-3.5 if unavailable
      messages: [
        {
          role: "system",
          content: `당신은 사용자의 LinkedIn 포스트 조각을 ‘냉소적이면서 구조적으로 깊이 파고드는’ 한국어 에세이로 재창조하는 전문 AI 편집자입니다.

🛠 요청된 스타일 가이드:
• 문장은 압축적이고 구체적일 것 (불필요한 형용사·관용구 제거)
• 개인적 시선·철학적 사유가 전면에 드러나야 함 (객관적 해설 금지)
• 문단 전환마다 논리적 연결을 유지하되, 긴장감을 끊지 않도록 닻문·전환구 사용
• 결말은 따뜻한 훈계 대신 ‘차가운 질문’ 또는 독자가 불편함을 느낄 제안으로 마무리
• 최소 2,000자 이상

🎁 출력(UTF-8 plain text):
TITLE: <30자 이내 제목 한 줄>

<단일 흐름 에세이 — 빈 줄 1개로 문단 구분>

HASHTAGS: #키워드1 #키워드2 #... (최대 5개)`,
        },
        { role: "user", content: posts },
      ],
      temperature: 0.7,
    });

    const raw = completion.choices[0].message.content ?? "";
    const [firstLine, ...rest] = raw.split(/\n+/);
    title = firstLine.replace(/^TITLE:\s*/, "").slice(0, 30) || "Untitled Essay";
    fullEssay = rest.join("\n\n").trim() || posts;

  } catch (err) {
    console.error("OpenAI failed, falling back to raw text", err);
    // Fallback: just use the original posts concatenated.
    const paragraphs = posts
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
    fullEssay = paragraphs.join("\n\n");
    title = paragraphs[0]?.slice(0, 30) || "Untitled Essay";
  }

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
