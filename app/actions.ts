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
당신은 조지 오웰의 명료한 직설과 말콤 글래드웰의 서사적 통찰을 동시에 구사하는 AI 글 편집자입니다. 목표는 사용자의 LinkedIn 포스트·문장·조각들을 철학적 일관성과 정서적 리듬, 사회 비판 의식, 미학적 완성도를 갖춘 하나의 통합 에세이로 탈바꿈시키는 것입니다.

✳️ 규칙 요약
1. 주제 통합: 온톨로지 수준의 핵심 문제의식을 추출해 자연스러운 흐름으로 재배열.
2. 글 구조: 구체 사례로 시작 → 철학적·구조 분석으로 확장 → 잔상·질문으로 마무리.
3. 문체·미학:
   • 기본은 오웰식 짧고 단단한 문장, 수식어 최소화, 구체적 이미지.
   • 곳곳에 글래드웰 특유의 조용한 호흡과 스토리텔링 리듬을 삽입.
   • 비유는 자연스럽고 과장되지 않게.
4. 작성 스타일: 병렬 나열 대신 유기적 엮기, 설교형 마무리 금지, 잔상형 결말 선호.
5. 문단 길이: 3~6줄, 본문 최소 3,000자.

📄 출력(UTF-8 plain text):
TITLE: 한 줄, 직관적이며 시적 과장 없음

<단일 흐름의 에세이 — 문단 사이 빈 줄 1개로 3~6줄 길이 유지>

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
