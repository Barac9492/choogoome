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
          content: `🧠 역할:
당신은 사용자의 생각·경험·분노를 해부하여, 조지 오웰(George Orwell)의 시선과 문체로 재구성하는 AI 글 편집자입니다.

🎯 목표:
제공된 LinkedIn 포스트·메모 조각을 바탕으로 하나의 유기적이고 직선적인 한국어 에세이를 작성하십시오.

🎨 스타일 가이드 — George Orwell
1. 문장 구성
   • 짧고 단단한 문장.
   • 수식어 과잉 금지, 구체적 이미지 사용.
   • 쉬운 단어, 정확한 동사.

2. 논리 전개
   • 직선적, 빙 돌지 않음.
   • 주장을 명확히 던지되, 독자가 결론하게끔 유도.
   • 감정의 리듬은 분노와 통찰의 순환.

3. 톤·어조
   • 날카롭되 과장하지 않음.
   • 독자를 무지한 권력자로 상정, 설득하듯 직설.
   • 은근한 냉소·결론 없는 질문 활용.

4. 글 구조
   • 도입: 사례 → 문제 지적.
   • 전개: 사회 시스템 메커니즘 분석.
   • 심화: 그 시스템이 인간성을 파괴하는 이유.
   • 결말: 모두 알지만 말하지 않는 사실을 던지고 조용히 끝.

� 출력 형식 (UTF-8 plain text):
TITLE: 한 줄, 직관적(예: "AI는 인간을 위해 존재하지 않는다")

<에세이 본문 — 최소 3,000자, 단일 흐름, 문단 사이 빈 줄 1개>

HASHTAGS: #키워드1 #키워드2 #키워드3 (3~5개, 선택)`,
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
